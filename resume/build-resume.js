// Converts resume.json into a LaTeX resume (resume.tex).
// Usage: node resume/build-resume.js   then compile with: tectonic resume/resume.tex
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "resume.json"), "utf8"));

const esc = (s = "") =>
  String(s)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/·/g, "\\textperiodcentered{}");

const range = (a, b) => (a === b || !b ? esc(a) : `${esc(a)} -- ${esc(b)}`);
const items = (list) =>
  list && list.length
    ? `  \\begin{itemize}\n${list.map((h) => `    \\item ${esc(h)}`).join("\n")}\n  \\end{itemize}`
    : "";

const { basics } = data;
const contact = [
  esc(basics.location),
  `\\href{mailto:${basics.email}}{${esc(basics.email)}}`,
  ...basics.profiles.map((p) => `\\href{${p.url}}{${esc(p.network)}: ${esc(p.username)}}`),
].join(" \\enspace$\\cdot$\\enspace ");

const education = data.education
  .map((e) => `\\entry{${esc(e.institution)}}{${range(e.startDate, e.endDate)}}{${esc(e.area)}}{${esc(e.location)}}`)
  .join("\n");

const work = data.work
  .map((w) => `\\entry{${esc(w.position)}}{${range(w.startDate, w.endDate)}}{${esc(w.organization)}}{}\n${items(w.highlights)}`)
  .join("\n");

const projects = data.projects
  .map((p) => {
    const title = p.url ? `\\href{${p.url}}{${esc(p.name)}}` : esc(p.name);
    // keywords = written by hand; aiKeywords = built with AI assistance
    const own = (p.keywords || []).map(esc).join(", ");
    const ai = (p.aiKeywords || []).length ? `AI-assisted: ${p.aiKeywords.map(esc).join(", ")}` : "";
    const tech = [own, ai].filter(Boolean).join(" $\\cdot$ ");
    return `\\project{${title}}{${tech}}\n${items(p.highlights)}`;
  })
  .join("\n");

const awards = data.awards
  .map((a) => `  \\item \\textbf{${esc(a.title)}} --- ${esc(a.awarder)} \\hfill ${esc(a.date)}`)
  .join("\n");

const certs = data.certificates.map((c) => `${esc(c.name)} (${esc(c.issuer)})`).join("; ");

const skills = data.skills
  .map((s) => `\\textbf{${esc(s.name)}:} & ${s.keywords.map(esc).join(", ")} \\\\`)
  .join("\n");
const languages = data.languages.map((l) => `${esc(l.language)} (${esc(l.fluency)})`).join(", ");

const tex = String.raw`%-------------------------------------------------------------
% Resume of ${basics.name}
% Generated from resume/resume.json by resume/build-resume.js
%-------------------------------------------------------------
\documentclass[10pt,a4paper]{article}
\usepackage[margin=0.55in,top=0.45in,bottom=0.45in]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{xcolor}
\usepackage{tabularx}

\definecolor{accent}{HTML}{0B6E4F}
\hypersetup{colorlinks=true,urlcolor=accent,linkcolor=accent}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{leftmargin=1.2em,topsep=1pt,itemsep=0pt,parsep=0pt,label=\textbullet}
\titleformat{\section}{\large\bfseries\color{accent}\scshape}{}{0em}{}[\vspace{-6pt}\rule{\linewidth}{0.5pt}]
\titlespacing*{\section}{0pt}{8pt}{4pt}

% \entry{title}{dates}{subtitle}{location}
\newcommand{\entry}[4]{%
  \vspace{2pt}\textbf{#1} \hfill {\small #2}\\
  \textit{#3} \hfill {\small\textit{#4}}\par}
% \project{title}{tech stack}
\newcommand{\project}[2]{%
  \textbf{#1} \hfill {\small\textit{#2}}\par}

\begin{document}

\begin{center}
  {\LARGE\bfseries ${esc(basics.name)}}\\[3pt]
  {\small ${esc(basics.label)}}\\[3pt]
  {\small ${contact}}
\end{center}

\section{Summary}
${esc(basics.summary)}

\section{Education}
${education}

\section{Experience}
${work}

\section{Projects}
${projects}

\section{Awards \& Recognition}
\begin{itemize}
${awards}
\end{itemize}

\section{Skills}
\begin{tabularx}{\linewidth}{@{}l X@{}}
${skills}
\textbf{Languages:} & ${languages} \\
\textbf{Certifications:} & ${certs} \\
\end{tabularx}

\end{document}
`;

fs.writeFileSync(path.join(__dirname, "resume.tex"), tex);
console.log("Wrote resume/resume.tex");
