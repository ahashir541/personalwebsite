import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { collection, getDocs, getFirestore, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const config = window.firebaseConfig, status = document.querySelector("#blog-status"), grid = document.querySelector("#blog-grid"), search = document.querySelector("#blog-search"), category = document.querySelector("#blog-category"), more = document.querySelector("#blog-load-more");
const safe = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&#039;", "'": "&#039;" })[c]);
let posts = [], visible = 6;
function renderFeatured() { const target = document.querySelector("#featured-post"), post = posts.find((item) => item.featured) || posts[0]; if (!post) { target.innerHTML = ""; return; } target.innerHTML = `<a class="featured-post" href="post.html?id=${encodeURIComponent(post.id)}"><div class="featured-post__image">${post.coverUrl ? `<img src="${safe(post.coverUrl)}" alt="" loading="eager">` : '<span>H.</span>'}</div><div class="featured-post__copy"><div class="eyebrow">Featured field note</div><h2>${safe(post.title)}</h2><p>${safe(post.excerpt)}</p><span class="blog-read-link">Read the story <span aria-hidden="true">↗</span></span></div></a>`; }
function render() {
  const term = search.value.toLowerCase().trim(), selected = category.value;
  const filtered = posts.filter((post) => (!selected || post.category === selected) && (!term || `${post.title} ${post.excerpt} ${(post.tags || []).join(" ")}`.toLowerCase().includes(term)));
  const shown = filtered.slice(0, visible);
  status.textContent = `${filtered.length} published ${filtered.length === 1 ? "note" : "notes"}`;
  grid.innerHTML = shown.length ? shown.map((post) => {
    const date = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
    const image = post.coverUrl ? `<img src="${safe(post.coverUrl)}" alt="" loading="lazy">` : `<span class="blog-card__placeholder" aria-hidden="true">H<span>.</span></span>`;
    return `<article class="blog-card reveal"><div class="blog-card__cover">${image}</div><div class="blog-card__body">${post.featured ? '<span class="featured-badge">Featured</span>' : ""}<div class="blog-card__meta">${safe(post.category)} <span>·</span> ${date}</div><h2>${safe(post.title)}</h2><p>${safe(post.excerpt)}</p><a class="blog-read-link" href="post.html?id=${encodeURIComponent(post.id)}">Read note <span aria-hidden="true">↗</span></a></div></article>`;
  }).join("") : `<div class="empty">No posts match your search.</div>`;
  grid.querySelectorAll(".reveal").forEach((element) => element.classList.add("in")); more.hidden = visible >= filtered.length;
}
async function load() {
  if (!config?.projectId || config.apiKey.startsWith("YOUR_")) { status.textContent = "Firebase is not configured yet."; return; }
  try { const result = await getDocs(query(collection(getFirestore(initializeApp(config)), "posts"), where("published", "==", true))); posts = result.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); [...new Set(posts.map((post) => post.category).filter(Boolean))].sort().forEach((item) => category.insertAdjacentHTML("beforeend", `<option value="${safe(item)}">${safe(item)}</option>`)); renderFeatured(); render(); } catch (error) { console.error(error); status.textContent = "Posts could not be loaded. Check Firebase rules."; }
}
search.addEventListener("input", () => { visible = 6; render(); }); category.addEventListener("change", () => { visible = 6; render(); }); more.addEventListener("click", () => { visible += 6; render(); }); load();
