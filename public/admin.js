import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const config = window.firebaseConfig;
const CLOUD_NAME = "ubo3eo9f", UPLOAD_PRESET = "HASHIR";
const $ = (selector) => document.querySelector(selector);
const status = $("#admin-status"), editor = $("#content-editor"), form = $("#post-form");
const recoveryKey = "hashir-blog-recovery-v1";
const configured = config?.apiKey && !config.apiKey.startsWith("YOUR_") && config.projectId && !config.projectId.startsWith("YOUR_");
const escapeText = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
const slugify = (value) => String(value || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
let auth, db, currentUser, saveTimer, savedRange, recoveryPrompted = false, posts = [];

function message(value) { status.textContent = value; }
function field(id) { return $(`#${id}`).value.trim(); }
function setField(id, value) { $(`#${id}`).value = value || ""; }
function snapshotForm() {
  return { title: field("post-title"), excerpt: field("post-excerpt"), category: field("post-category"), tags: field("post-tags").split(",").map((tag) => tag.trim()).filter(Boolean), slug: field("post-slug") || slugify(field("post-title")), metaTitle: field("post-meta-title"), metaDescription: field("post-meta-description"), coverUrl: field("post-cover"), content: editor.innerHTML, status: $("#post-status").value, published: $("#post-status").value === "published", scheduledAt: $("#post-publish-date").value || "", featured: $("#post-featured").checked };
}
function resetEditor() { form.reset(); editor.innerHTML = ""; $("#editing-id").value = ""; $("#editor-heading").textContent = "New post"; $("#cover-preview").innerHTML = ""; localStorage.removeItem(recoveryKey); updateCount(); message("Ready for a new post."); }
function updateCount() {
  const words = (editor.innerText.trim().match(/\S+/g) || []).length, goal = Math.max(100, Number($("#word-goal").value) || 800);
  $("#word-count").textContent = `${words} words · ${Math.max(1, Math.ceil(words / 200))} min read`;
  $("#word-goal-progress").max = goal; $("#word-goal-progress").value = Math.min(words, goal); $("#word-goal-label").textContent = `${words} / ${goal} words`;
  updateOutline();
}
function updateOutline() {
  const headings = [...editor.querySelectorAll("h1,h2,h3")], outline = $("#article-outline");
  headings.forEach((heading, index) => { if (!heading.id) heading.id = `draft-heading-${index + 1}`; });
  outline.innerHTML = headings.length ? headings.map((heading) => `<a class="outline-link outline-link--${heading.tagName.toLowerCase()}" href="#${heading.id}">${escapeText(heading.innerText || "Untitled heading")}</a>`).join("") : "<span>Add headings to build your outline.</span>";
}
function saveSelection() { const selection = window.getSelection(); if (selection?.rangeCount) savedRange = selection.getRangeAt(0); }
function restoreSelection() { if (savedRange) { const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(savedRange); } editor.focus(); }
function sanitizeHtml(html) {
  const template = document.createElement("template"); template.innerHTML = html;
  const allowed = new Set(["P","BR","H1","H2","H3","H4","H5","H6","STRONG","B","EM","I","U","S","DEL","UL","OL","LI","BLOCKQUOTE","PRE","CODE","A","IMG","VIDEO","AUDIO","SOURCE","IFRAME","TABLE","THEAD","TBODY","TR","TH","TD","HR","DIV","SPAN","FIGURE","FIGCAPTION"]);
  template.content.querySelectorAll("*").forEach((node) => {
    if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase(), value = attribute.value;
      if (name.startsWith("on") || name === "style" && /url\s*\(|expression/i.test(value) || name === "src" && node.tagName === "IFRAME" && !/^https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com)\//i.test(value)) node.removeAttribute(attribute.name);
      else if (["href","src"].includes(name) && !/^(https?:|mailto:|data:image\/)/i.test(value)) node.removeAttribute(attribute.name);
      else if (!["href","src","alt","title","target","controls","allowfullscreen","width","height","colspan","rowspan","style","class","loading"].includes(name)) node.removeAttribute(attribute.name);
    });
    if (node.tagName === "A") { node.setAttribute("rel", "noopener noreferrer"); if (!node.getAttribute("target")) node.setAttribute("target", "_blank"); }
  });
  return template.innerHTML;
}
async function upload(file, kind = "image") {
  if (!file) return "";
  const isImage = file.type.startsWith("image/"), max = isImage ? 5 : 50;
  if (file.size > max * 1024 * 1024) throw new Error(`File must be ${max} MB or smaller.`);
  message(`Uploading ${file.name}…`);
  const data = new FormData(); data.append("file", file); data.append("upload_preset", UPLOAD_PRESET);
  const endpoint = isImage ? "image" : kind === "audio" ? "raw" : "video";
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`, { method: "POST", body: data });
  if (!response.ok) throw new Error("Cloudinary rejected this file.");
  return (await response.json()).secure_url;
}
function insertHtml(html) { restoreSelection(); document.execCommand("insertHTML", false, html); updateCount(); scheduleDraft(); }
function embedVideo(url) {
  let parsed; try { parsed = new URL(url); } catch { return false; }
  if (!/^https?:$/.test(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"].includes(host)) {
    const id = host === "youtu.be" ? parsed.pathname.slice(1).split("/")[0] : parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return false;
    insertHtml(`<figure class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" loading="lazy" allowfullscreen></iframe></figure>`); return true;
  }
  if (["vimeo.com", "www.vimeo.com"].includes(host)) {
    const id = parsed.pathname.match(/^\/(\d+)/)?.[1]; if (!id) return false;
    insertHtml(`<figure class="video-embed"><iframe src="https://player.vimeo.com/video/${id}" title="Vimeo video player" loading="lazy" allowfullscreen></iframe></figure>`); return true;
  }
  if (parsed.pathname.match(/\.(mp4|webm)$/i)) { insertHtml(`<video controls src="${escapeText(parsed.href)}">Video</video>`); return true; }
  return false;
}
async function handleMedia(type) {
  saveSelection();
  const fileInput = $("#media-file"); fileInput.accept = type === "image" ? "image/jpeg,image/png,image/webp" : type === "video" ? "video/mp4,video/webm" : "audio/mpeg,audio/wav,audio/ogg"; fileInput.click();
  fileInput.onchange = async () => { try { const url = await upload(fileInput.files[0], type); const label = type === "image" ? "Uploaded image" : type === "video" ? "Uploaded video" : "Uploaded audio"; insertHtml(type === "image" ? `<figure><img src="${url}" alt="${label}"><figcaption>${label}</figcaption></figure>` : `<${type} controls src="${url}">${label}</${type}>`); message(`${label} inserted.`); } catch (error) { message(error.message); } fileInput.value = ""; };
}
async function savePost(mode = "draft") {
  const id = $("#editing-id").value, data = snapshotForm(); data.content = sanitizeHtml(data.content); data.status = mode === "publish" ? "published" : mode === "draft" ? "draft" : data.status; data.published = data.status === "published"; data.readingTime = Math.max(1, Math.ceil((editor.innerText.trim().match(/\S+/g) || []).length / 200)); data.updatedAt = serverTimestamp();
  if (!data.title || !data.excerpt || !data.category || !data.content) throw new Error("Title, excerpt, category, and content are required.");
  if (data.status === "published") data.publishedAt = serverTimestamp();
  if (id) await updateDoc(doc(db, "posts", id), data); else { data.authorId = currentUser.uid; data.createdAt = serverTimestamp(); const created = await addDoc(collection(db, "posts"), data); $("#editing-id").value = created.id; $("#editor-heading").textContent = "Edit post"; }
  $("#save-status").textContent = data.status === "published" ? "Published" : "Saved"; await loadPosts();
  if (mode !== "autosave") { localStorage.removeItem(recoveryKey); if (!id) resetEditor(); }
}
function scheduleDraft() {
  clearTimeout(saveTimer); $("#save-status").textContent = "Unsaved changes";
  try { localStorage.setItem(recoveryKey, JSON.stringify({ ...snapshotForm(), savedAt: new Date().toISOString() })); } catch (error) { console.warn("Local recovery save skipped:", error); }
  saveTimer = setTimeout(async () => { if (field("post-title")) { try { await savePost("autosave"); } catch (error) { console.warn("Autosave skipped:", error.message); } } }, 1800);
}
function restoreRecovery() {
  try {
    const saved = JSON.parse(localStorage.getItem(recoveryKey) || "null");
    if (!saved || !saved.title && !saved.content) return;
    if (!confirm("Restore your unsaved blog draft from this browser?")) { localStorage.removeItem(recoveryKey); return; }
    Object.entries({ title: saved.title, excerpt: saved.excerpt, category: saved.category, tags: (saved.tags || []).join(", "), slug: saved.slug, metaTitle: saved.metaTitle, metaDescription: saved.metaDescription, cover: saved.coverUrl }).forEach(([id, value]) => setField(id, value));
    editor.innerHTML = sanitizeHtml(saved.content || ""); $("#post-status").value = saved.status || "draft"; $("#post-featured").checked = Boolean(saved.featured); updateCount(); message("Recovered your unsaved draft from this browser.");
  } catch (error) { console.warn("Draft recovery could not be restored:", error); }
}
function renderPreview() { const data = snapshotForm(); $("#preview-content").innerHTML = `<div class="eyebrow">${escapeText(data.category)} · ${data.readingTime || "Draft"}</div><h1>${escapeText(data.title || "Untitled post")}</h1><p class="post-excerpt">${escapeText(data.excerpt)}</p><div class="post-content">${sanitizeHtml(data.content) || "<p>Your content preview will appear here.</p>"}</div>`; $("#preview-dialog").showModal(); }
function renderManager() { $("#posts-manager-list").innerHTML = posts.length ? posts.map((post) => `<div class="managed-post"><div class="managed-post__identity">${post.coverUrl ? `<img src="${escapeText(post.coverUrl)}" alt="">` : '<span class="managed-post__placeholder">H.</span>'}<div><strong>${escapeText(post.title || "Untitled")}</strong><small>${escapeText(post.status || (post.published ? "published" : "draft"))} · ${escapeText(post.category)}</small></div></div><div><button class="text-button" data-edit="${post.id}" type="button">Edit</button><button class="text-button text-button--danger" data-delete="${post.id}" type="button">Delete</button></div></div>`).join("") : `<p class="admin-help">No posts yet.</p>`; $("#stat-total").textContent = posts.length; $("#stat-published").textContent = posts.filter((post) => post.published).length; $("#stat-drafts").textContent = posts.filter((post) => (post.status || "draft") === "draft").length; $("#stat-featured").textContent = posts.filter((post) => post.featured).length; }
async function loadPosts() { const result = await getDocs(collection(db, "posts")); posts = result.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0)); renderManager(); }
function editPost(post) { $("#editing-id").value = post.id; $("#editor-heading").textContent = "Edit post"; Object.entries({ title: post.title, excerpt: post.excerpt, category: post.category, tags: (post.tags || []).join(", "), slug: post.slug, metaTitle: post.metaTitle, metaDescription: post.metaDescription, cover: post.coverUrl }).forEach(([id, value]) => setField(id, value)); editor.innerHTML = sanitizeHtml(post.content || ""); $("#post-status").value = post.status || (post.published ? "published" : "draft"); $("#post-featured").checked = Boolean(post.featured); $("#cover-preview").innerHTML = post.coverUrl ? `<img src="${escapeText(post.coverUrl)}" alt="">` : ""; window.scrollTo({ top: document.querySelector("#studio-panel").offsetTop, behavior: "smooth" }); updateCount(); }

if (!configured) { message("Add Firebase settings before using the studio."); $("#login-form").querySelectorAll("input,button").forEach((element) => { element.disabled = true; }); }
else {
  const app = initializeApp(config); auth = getAuth(app); db = getFirestore(app);
  onAuthStateChanged(auth, async (user) => {
    currentUser = user; $("#auth-panel").hidden = Boolean(user); $("#studio-panel").hidden = !user;
    if (!user) return;
    try {
      if (!(await getDoc(doc(db, "admins", user.uid))).exists()) {
        await signOut(auth); message("This account is not an administrator."); return;
      }
    } catch (error) {
      console.error("Admin record check failed:", error);
      await signOut(auth);
      message(`Administrator check failed (${error.code || "unknown"}): ${error.message || "Check that Firestore rules are published."}`);
      return;
    }
    message(`Signed in as ${user.email}`);
    try { await loadPosts(); if (!recoveryPrompted) { recoveryPrompted = true; restoreRecovery(); } }
    catch (error) { console.error("Post manager load failed:", error); message(`Signed in, but posts could not be loaded (${error.code || "unknown"}). Publish the updated firestore.rules file.`); }
  });
  $("#login-form").addEventListener("submit", async (event) => { event.preventDefault(); message("Signing in…"); try { await signInWithEmailAndPassword(auth, field("login-email"), $("#login-password").value); } catch (error) { message(`Sign-in failed (${error.code || "unknown"}).`); } });
  $("#reset-password-button").addEventListener("click", async () => { const email = field("login-email"); if (!email) { message("Enter your account email first, then choose password reset."); $("#login-email").focus(); return; } try { await sendPasswordResetEmail(auth, email); message(`Password reset email sent to ${email}. Check your inbox and spam folder.`); } catch (error) { message(`Could not send the reset email (${error.code || "unknown"}). Check the email and Firebase Authentication settings.`); } });
  $("#logout-button").addEventListener("click", () => signOut(auth)); $("#new-post-button").addEventListener("click", resetEditor);
  $("#word-goal").addEventListener("input", updateCount);
  $("#focus-mode-button").addEventListener("click", (event) => { const active = document.body.classList.toggle("focus-mode"); event.currentTarget.setAttribute("aria-pressed", String(active)); event.currentTarget.textContent = active ? "Exit focus mode" : "Focus mode"; });
  form.addEventListener("submit", async (event) => { event.preventDefault(); const button = $("#publish-button"); button.disabled = true; try { await savePost("publish"); message("Post published."); } catch (error) { console.error(error); message(`Publishing failed: ${error.message}`); } finally { button.disabled = false; } });
  $("#save-draft-button").addEventListener("click", async () => { try { await savePost("draft"); message("Draft saved."); } catch (error) { message(`Draft failed: ${error.message}`); } });
  editor.addEventListener("input", () => { updateCount(); scheduleDraft(); }); editor.addEventListener("keyup", saveSelection); editor.addEventListener("mouseup", saveSelection);
  document.querySelectorAll("[data-command]").forEach((control) => control.addEventListener("change", () => { restoreSelection(); document.execCommand(control.dataset.command, false, control.dataset.value || control.value); updateCount(); scheduleDraft(); }));
  document.querySelectorAll("button[data-command]").forEach((control) => control.addEventListener("click", () => { restoreSelection(); document.execCommand(control.dataset.command, false, control.dataset.value || null); updateCount(); scheduleDraft(); }));
  $("#link-button").addEventListener("click", () => { saveSelection(); const url = prompt("Paste a secure URL (https://…)"); if (url && /^https?:\/\//i.test(url)) insertHtml(`<a href="${encodeURI(url)}" target="_blank" rel="noopener noreferrer">${escapeText(url)}</a>`); });
  $("#image-button").addEventListener("click", () => handleMedia("image")); $("#video-button").addEventListener("click", () => { const url = prompt("Paste a YouTube, Vimeo, or direct video URL. Cancel to upload a video file."); if (url) { if (!embedVideo(url.trim())) message("That video link was not recognized. Use a YouTube, Vimeo, MP4, or WebM URL."); } else handleMedia("video"); }); $("#audio-button").addEventListener("click", () => handleMedia("audio")); $("#table-button").addEventListener("click", () => { const rows = Math.max(1, Number(prompt("Rows?", "2")) || 2), cols = Math.max(1, Number(prompt("Columns?", "2")) || 2); insertHtml(`<table><tbody>${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => "<td>Cell</td>").join("")}</tr>`).join("")}</tbody></table>`); });
  $("#post-title").addEventListener("input", () => { if (!field("post-slug")) setField("post-slug", slugify(field("post-title"))); scheduleDraft(); }); $("#post-cover-file").addEventListener("change", async (event) => { try { const url = await upload(event.target.files[0]); setField("post-cover", url); $("#cover-preview").innerHTML = `<img src="${escapeText(url)}" alt="">`; } catch (error) { message(error.message); } }); $("#preview-button").addEventListener("click", renderPreview); $(".dialog-close").addEventListener("click", () => $("#preview-dialog").close());
  $("#posts-manager-list").addEventListener("click", async (event) => { const editId = event.target.dataset.edit, deleteId = event.target.dataset.delete; if (editId) editPost(posts.find((post) => post.id === editId)); if (deleteId && confirm("Delete this post permanently?")) { await deleteDoc(doc(db, "posts", deleteId)); message("Post deleted."); await loadPosts(); } });
}
