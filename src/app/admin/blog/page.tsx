"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BlogPost, SeoExceptionRule } from "@/content/blog";
import { treatments } from "@/config/clinic";
import { seoChecks, seoScore, slugify } from "@/lib/blogSeo";
import styles from "./BlogAdmin.module.css";

type Screen = "loading" | "login" | "ready" | "setup";
type Filter = "all" | "published" | "draft";
type EditorTab = "write" | "preview";
type ExceptionScope = "both" | SeoExceptionRule;

const categories = ["Dental Health", "Treatments", "Prevention", "Oral Surgery", "Dental Implants", "Patient Guide"];

function emptyPost(): BlogPost {
  return {
    slug: "",
    title: "",
    excerpt: "",
    category: "Dental Health",
    status: "draft",
    readTime: "1 min read",
    featuredImage: "",
    imageAlt: "",
    imageRightsConfirmed: false,
    seoTitle: "",
    metaDescription: "",
    primaryTopic: "",
    seoExceptions: [],
    author: "Tanvi Dental Care Editorial Team",
    reviewedBy: "",
    reviewedAt: "",
    tags: [],
    body: "## Introduction\n\nStart writing your patient-friendly article here.\n\n## What patients should know\n\nExplain the topic clearly and avoid making a diagnosis for the reader.",
  };
}

async function optimiseImage(file: File) {
  if (!("createImageBitmap" in window)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 1600;
    const maxHeight = 1200;
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function PreviewBody({ body }: { body: string }) {
  return (
    <div className={styles.previewBody}>
      {body.split(/\n\n+/).filter(Boolean).map((block, index) => {
        const line = block.trim();
        if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
        if (line.split("\n").every((item) => item.startsWith("- "))) {
          return <ul key={index}>{line.split("\n").map((item) => <li key={item}>{item.slice(2)}</li>)}</ul>;
        }
        if (line.startsWith("![](")) return null;
        if (line.match(/^!\[[^\]]*\]\([^)]+\)$/)) {
          const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)!;
          return <img key={index} src={match[2]} alt={match[1]} />;
        }
        return <p key={index}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export default function BlogAdminPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("write");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publicStorageConfirmed, setPublicStorageConfirmed] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [exceptionPhrase, setExceptionPhrase] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionScope, setExceptionScope] = useState<ExceptionScope>("both");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadPosts = async () => {
    setScreen("loading");
    const response = await fetch("/api/admin/blog", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) return setScreen("login");
    if (response.status === 503) return setScreen("setup");
    if (!response.ok) {
      setNotice({ type: "error", text: data.error || "Unable to load blog posts." });
      return setScreen("login");
    }
    const loadedPosts: BlogPost[] = data.posts || [];
    setPosts(loadedPosts);
    const requestedDraft = new URLSearchParams(window.location.search).get("draft");
    const linkedDraft = requestedDraft ? loadedPosts.find((post) => post.slug === requestedDraft && post.status === "draft") : undefined;
    if (linkedDraft) {
      choosePost(linkedDraft);
      setNotice({ type: "success", text: "Draft opened from Content OS. Review the article, confirm the medical content, and use the existing publishing checks when ready." });
    }
    setScreen("ready");
  };

  useEffect(() => { void loadPosts(); }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 503) return setScreen("setup");
    if (!response.ok) return setNotice({ type: "error", text: data.error || "Unable to sign in." });
    setPassword("");
    await loadPosts();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setSelected(null);
    setScreen("login");
  };

  const resetExceptionForm = () => {
    setExceptionPhrase("");
    setExceptionReason("");
    setExceptionScope("both");
  };

  const startNew = () => {
    const post = emptyPost();
    setSelected(post);
    setOriginalSlug("");
    setSlugTouched(false);
    setEditorTab("write");
    setNotice(null);
    setPublicStorageConfirmed(false);
    resetExceptionForm();
  };

  const choosePost = (post: BlogPost) => {
    setSelected({
      ...post,
      tags: [...post.tags],
      imageRightsConfirmed: post.imageRightsConfirmed === true,
      seoExceptions: (post.seoExceptions || []).map((exception) => ({ ...exception, rules: [...exception.rules] })),
    });
    setOriginalSlug(post.slug);
    setSlugTouched(true);
    setEditorTab("write");
    setNotice(null);
    setPublicStorageConfirmed(false);
    resetExceptionForm();
  };

  const update = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setSelected((current) => current ? { ...current, [key]: value } : current);
  };

  const titleChanged = (value: string) => {
    setSelected((current) => {
      if (!current) return current;
      return { ...current, title: value, seoTitle: current.seoTitle || value, slug: slugTouched ? current.slug : slugify(value) };
    });
  };

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea || !selected) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const chosen = selected.body.slice(start, end) || "text";
    const next = `${selected.body.slice(0, start)}${before}${chosen}${after}${selected.body.slice(end)}`;
    update("body", next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + chosen.length);
    });
  };

  const addSeoException = () => {
    if (!selected) return;
    const phrase = exceptionPhrase.trim();
    const reason = exceptionReason.trim();
    if (!phrase || !reason) {
      setNotice({ type: "error", text: "Add both an exception phrase and an editorial reason." });
      return;
    }
    const rules: SeoExceptionRule[] = exceptionScope === "both" ? ["topic-title", "topic-intro"] : [exceptionScope];
    const duplicate = (selected.seoExceptions || []).some((exception) =>
      exception.phrase.toLowerCase() === phrase.toLowerCase() &&
      rules.every((rule) => exception.rules.includes(rule))
    );
    if (duplicate) {
      setNotice({ type: "error", text: "That SEO exception already exists for the selected scope." });
      return;
    }
    update("seoExceptions", [
      ...(selected.seoExceptions || []),
      {
        id: `seo-exception-${Date.now()}`,
        phrase,
        rules,
        reason,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    resetExceptionForm();
    setNotice({ type: "success", text: "SEO exception added. Save the draft or publish to persist it." });
  };

  const removeSeoException = (id: string) => {
    if (!selected) return;
    update("seoExceptions", (selected.seoExceptions || []).filter((exception) => exception.id !== id));
    setNotice({ type: "success", text: "SEO exception removed. Save the draft or publish to persist it." });
  };

  const upload = async (file: File, inline = false) => {
    if (!selected) return;
    if (!publicStorageConfirmed) {
      setNotice({ type: "error", text: "Confirm public repository storage before uploading." });
      return;
    }
    if (selected.imageRightsConfirmed !== true) {
      setNotice({ type: "error", text: "Confirm image ownership or publication rights before uploading." });
      return;
    }
    const inlineAlt = inline ? window.prompt("Describe this image accurately for accessibility:", "")?.trim() : "";
    if (inline && !inlineAlt) {
      setNotice({ type: "error", text: "Add accurate alt text before uploading an inline image." });
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const prepared = await optimiseImage(file);
      const form = new FormData();
      form.append("file", prepared);
      form.append("name", selected.slug || selected.title || "blog-image");
      form.append("publicStorageConfirmed", "true");
      form.append("rightsConfirmed", "true");
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Image upload failed.");
      if (inline) {
        update("body", `${selected.body.trim()}\n\n![${inlineAlt}](${data.url})\n`);
      } else {
        update("featuredImage", data.url);
      }
      setNotice({ type: "success", text: "Image uploaded to the blog media library." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to upload image." });
    } finally {
      setUploading(false);
    }
  };

  const save = async (action: "draft" | "publish") => {
    if (!selected) return;
    if (!publicStorageConfirmed) {
      setNotice({ type: "error", text: "Confirm public repository storage before saving or publishing." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: selected, originalSlug, action, publicStorageConfirmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save the post.");
      const saved = data.post as BlogPost;
      setSelected(saved);
      setOriginalSlug(saved.slug);
      setSlugTouched(true);
      setPosts((current) => [saved, ...current.filter((post) => post.slug !== originalSlug && post.slug !== saved.slug)]);
      setNotice({
        type: "success",
        text: action === "publish"
          ? "Published to GitHub. The connected deployment will rebuild the blog, sitemap, schema, treatment links and social metadata automatically."
          : "Draft saved to the public GitHub repository. It is excluded from the public blog and sitemap but remains visible in repository history.",
      });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to save the post." });
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = useMemo(() => posts.filter((post) => filter === "all" || post.status === filter), [posts, filter]);
  const checks = selected ? seoChecks(selected) : [];
  const score = selected ? seoScore(selected) : 0;
  const exceptionCount = selected?.seoExceptions?.length || 0;

  if (screen === "loading") {
    return <main className={styles.page}><div className={styles.authShell}><div className={styles.loginCard}><h1>Tanvi Blog Manager</h1><p>Loading your content workspace…</p></div></div></main>;
  }

  if (screen === "setup") {
    return <main className={styles.page}><div className={styles.authShell}><div className={styles.setupCard}><h1>One-time setup required</h1><p>The Blog Manager code is installed, but publishing stays locked until the production secrets are configured.</p><ul className={styles.setupList}><li><code>BLOG_ADMIN_PASSWORD</code> — clinic editor password</li><li><code>BLOG_ADMIN_SESSION_SECRET</code> — long random session signing secret</li><li><code>GITHUB_CONTENT_TOKEN</code> — fine-grained token with Contents read/write for this repository</li><li><code>GITHUB_CONTENT_REPOSITORY</code> — optional; defaults to Mr-Nani-dm/Tanvi-Dental-Care</li><li><code>GITHUB_CONTENT_BRANCH</code> — optional; defaults to main</li></ul><p>Once those environment variables are present, this page becomes the login screen automatically.</p></div></div></main>;
  }

  if (screen === "login") {
    return <main className={styles.page}><div className={styles.authShell}><div className={styles.loginCard}><div className={styles.brand}><span className={styles.brandMark}>T</span><div><strong>TANVI DENTAL</strong><span>Content Management</span></div></div><h1 style={{ marginTop: 28 }}>Blog Manager</h1><p>Sign in to write, optimise, preview and publish patient education articles.</p>{notice && <div className={`${styles.notice} ${notice.type === "success" ? styles.success : styles.error}`}>{notice.text}</div>}<form className={styles.loginForm} onSubmit={login}><div className={styles.field}><label htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><button className={styles.primaryButton} type="submit">Sign in</button></form></div></div></main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}><div className={styles.topbarInner}><div className={styles.brand}><span className={styles.brandMark}>T</span><div><strong>TANVI DENTAL</strong><span>Blog Manager</span></div></div><div className={styles.topActions}><a className={styles.ghostButton} href="/blog" target="_blank" rel="noopener noreferrer">View public blog</a><a className={styles.ghostButton} href="/admin/content">Content OS</a><button className={styles.ghostButton} type="button" onClick={logout}>Sign out</button></div></div></header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}><h1>Blog Posts</h1><p>Write → optimise → preview → publish</p><button className={styles.newButton} type="button" onClick={startNew}>+ New Post</button></div>
          <div className={styles.stats}><div className={styles.stat}><strong>{posts.length}</strong><span>All</span></div><div className={styles.stat}><strong>{posts.filter((post) => post.status === "published").length}</strong><span>Live</span></div><div className={styles.stat}><strong>{posts.filter((post) => post.status === "draft").length}</strong><span>Draft</span></div></div>
          <div className={styles.filters}>{(["all", "published", "draft"] as Filter[]).map((item) => <button key={item} className={`${styles.filter} ${filter === item ? styles.filterActive : ""}`} onClick={() => setFilter(item)}>{item === "all" ? "All" : item === "published" ? "Published" : "Drafts"}</button>)}</div>
          <div className={styles.postList}>{filteredPosts.map((post) => <button type="button" className={`${styles.postItem} ${selected?.slug === post.slug ? styles.postItemActive : ""}`} key={post.slug} onClick={() => choosePost(post)}><h3>{post.title}</h3><div className={styles.postMeta}><span className={`${styles.status} ${post.status === "published" ? styles.published : styles.draft}`}>{post.status}</span><span>{post.readTime}</span></div></button>)}</div>
        </aside>

        <section className={styles.content}>
          {!selected ? <div className={styles.emptyState}><div><h2>Create useful dental content.</h2><p>Select an existing post or create a new one. The manager handles the technical SEO pieces—canonical URLs, sitemap entries, BlogPosting schema, breadcrumbs, related content and treatment linking—when you publish.</p><button className={styles.primaryButton} type="button" onClick={startNew}>Create New Post</button></div></div> : <>
            <div className={styles.editor}>
              <div className={styles.mainCard}>
                <div className={styles.cardHeader}><div><h2>{originalSlug ? "Edit Article" : "New Article"}</h2><p>{selected.status === "published" ? "Currently published" : "Draft content"}</p></div><div className={styles.editorTabs}><button className={`${styles.tab} ${editorTab === "write" ? styles.tabActive : ""}`} onClick={() => setEditorTab("write")}>Write</button><button className={`${styles.tab} ${editorTab === "preview" ? styles.tabActive : ""}`} onClick={() => setEditorTab("preview")}>Preview</button></div></div>
                {editorTab === "write" ? <div className={styles.cardBody}>
                  {notice && <div className={`${styles.notice} ${notice.type === "success" ? styles.success : styles.error}`}>{notice.text}</div>}
                  <div className={styles.medicalNote}><strong>Public storage notice:</strong> drafts, article text and uploaded images are committed to a public GitHub repository and may remain in its history. Do not enter patient details, health records or other confidential information.<label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontWeight: 700 }}><input type="checkbox" checked={publicStorageConfirmed} onChange={(event) => setPublicStorageConfirmed(event.target.checked)} />I confirm this article contains no patient or confidential information and may be stored publicly.</label></div>
                  <div className={styles.field}><label>Article title *</label><input value={selected.title} onChange={(event) => titleChanged(event.target.value)} placeholder="Root Canal Treatment: What Patients Should Know" /></div>
                  <div className={styles.field}><label>URL slug *</label><input value={selected.slug} readOnly={!!selected.contentOsId} onChange={(event) => { setSlugTouched(true); update("slug", slugify(event.target.value)); }} placeholder="root-canal-treatment-patient-guide" /><div className={styles.hint}>Public URL: /blog/{selected.slug || "your-post-url"}{selected.contentOsId && <><br />Content OS article URLs are fixed after handoff. Choose the URL in Content OS before sending a draft here.</>}</div></div>
                  <div className={styles.twoCol}><div className={styles.field}><label>Category</label><select value={selected.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div><div className={styles.field}><label>Related treatment</label><select value={selected.treatmentSlug || ""} onChange={(event) => update("treatmentSlug", event.target.value)}><option value="">Select treatment</option>{treatments.map((treatment) => <option value={treatment.slug} key={treatment.slug}>{treatment.name}</option>)}</select></div></div>
                  {selected.contentOsId && <><div className={styles.medicalNote}><strong>Content OS draft:</strong> a qualified clinician must actually review this article. Enter the reviewer’s name and review date below. The content checks run again before publishing.</div><div className={styles.field}><label>Article call to action</label><input value={selected.contentOsCta || ""} onChange={(event) => update("contentOsCta", event.target.value)} placeholder="The single call to action used in the article" /><div className={styles.hint}>Keep this wording identical to the single call to action in the article body.</div></div></>}<div className={styles.field}><label>Short description *</label><textarea rows={3} value={selected.excerpt} onChange={(event) => update("excerpt", event.target.value)} placeholder="A short patient-friendly summary shown on the blog listing." /></div>
                  <div className={styles.imageBox}>{selected.featuredImage ? <img className={styles.imagePreview} src={selected.featuredImage} alt={selected.imageAlt || "Featured preview"} /> : <div className={styles.imagePreview} />}
                    <div className={styles.uploadRow}><strong>Featured image</strong><input className={styles.uploadInput} type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, false); }} />{uploading && <span>Optimising & uploading…</span>}</div>
                    <div className={styles.field} style={{ marginTop: 10 }}><label>Image alt text</label><input value={selected.imageAlt || ""} onChange={(event) => update("imageAlt", event.target.value)} placeholder="Describe what the image shows" /></div>
                    <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontSize: 12, lineHeight: 1.5 }}><input type="checkbox" checked={selected.imageRightsConfirmed === true} onChange={(event) => update("imageRightsConfirmed", event.target.checked)} /><span><strong>Image rights confirmed.</strong> Every featured or inline image is clinic-owned, properly licensed or otherwise authorised for this publication. It contains no identifiable patient without valid publication permission.</span></label>
                  </div>
                  <div className={styles.field}><label>Article content *</label><div className={styles.toolbar}><button type="button" className={styles.toolbarButton} onClick={() => insertText("**", "**")}>Bold</button><button type="button" className={styles.toolbarButton} onClick={() => insertText("## ")}>H2</button><button type="button" className={styles.toolbarButton} onClick={() => insertText("### ")}>H3</button><button type="button" className={styles.toolbarButton} onClick={() => insertText("- ")}>List</button><button type="button" className={styles.toolbarButton} onClick={() => insertText("[", "](/treatments)")}>Link</button><label className={styles.toolbarButton}>+ Image<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, true); }} /></label></div><textarea ref={textareaRef} className={styles.bodyTextarea} value={selected.body} onChange={(event) => update("body", event.target.value)} /><div className={styles.hint}>Use H2/H3 headings, short paragraphs and lists. HTML is intentionally disabled; the editor uses a safe lightweight format.</div></div>
                </div> : <div className={styles.cardBody}><div className={styles.preview}>{selected.featuredImage && <img className={styles.imagePreview} src={selected.featuredImage} alt={selected.imageAlt || ""} />}<h1>{selected.title || "Article title"}</h1><div className={styles.previewMeta}>{selected.category} · {selected.readTime}</div><p>{selected.excerpt}</p><PreviewBody body={selected.body} /></div></div>}
              </div>

              <div className={styles.sideStack}>
                <div className={styles.sideCard}><div className={styles.cardHeader}><div><h2>SEO Readiness</h2><p>Automatic publishing checks</p></div></div><div className={styles.cardBody}><div className={styles.score}><strong>{score}</strong><span>/ 100</span></div>{exceptionCount > 0 && <div className={styles.medicalNote}><strong>{exceptionCount} editorial SEO exception{exceptionCount === 1 ? "" : "s"} active.</strong> Exceptions do not inflate the raw SEO score and never override medical or trust blockers.</div>}<div className={styles.progress}><div className={styles.progressFill} style={{ width: `${score}%` }} /></div><div className={styles.checkList}>{checks.map((check) => <div className={styles.check} key={check.id}><span className={`${styles.checkIcon} ${check.status === "passed" ? styles.checkPass : styles.checkFail}`}>{check.status === "passed" ? "✓" : check.status === "exempt" ? "E" : "!"}</span><div><strong>{check.label}</strong><small>{check.guidance}</small></div></div>)}</div></div></div>

                <div className={styles.sideCard}><div className={styles.cardHeader}><div><h2>Search & Sharing</h2><p>Editable SEO fields</p></div></div><div className={styles.cardBody}><div className={styles.field}><label>SEO title</label><input value={selected.seoTitle || ""} onChange={(event) => update("seoTitle", event.target.value)} /></div><div className={styles.field}><label>Meta description *</label><textarea rows={4} value={selected.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} /></div><div className={styles.field}><label>Primary search topic</label><input value={selected.primaryTopic || ""} onChange={(event) => update("primaryTopic", event.target.value)} placeholder="root canal treatment" /></div><div className={styles.field}><label>Tags</label><input value={selected.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="root canal, tooth pain" /></div><div className={styles.googlePreview}><small>tanvidental… › blog › {selected.slug || "article"}</small><h4>{selected.seoTitle || selected.title || "SEO title preview"}</h4><p>{selected.metaDescription || "Add a clear meta description for the search result preview."}</p></div></div></div>

                <div className={styles.sideCard}><div className={styles.cardHeader}><div><h2>SEO Validation Exceptions</h2><p>Controlled editorial overrides</p></div></div><div className={styles.cardBody}>
                  <div className={styles.medicalNote}><strong>Protected rules stay locked:</strong> medical claims, unsupported guarantees, diagnosis certainty, reviewer integrity and other trust checks cannot be bypassed here.</div>
                  <div className={styles.field}><label>Exception word or phrase</label><input value={exceptionPhrase} onChange={(event) => setExceptionPhrase(event.target.value)} placeholder="Exact-match phrase to exempt" /><div className={styles.hint}>Use this only when the primary topic exact match would make the title or opening sound unnatural.</div></div>
                  <div className={styles.field}><label>Applies to</label><select value={exceptionScope} onChange={(event) => setExceptionScope(event.target.value as ExceptionScope)}><option value="both">Search title + opening paragraph</option><option value="topic-title">Search title exact match</option><option value="topic-intro">Opening paragraph exact match</option></select></div>
                  <div className={styles.field}><label>Editorial reason</label><textarea rows={3} value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} placeholder="Why this exact-match requirement is intentionally excluded" /></div>
                  <button className={styles.secondaryButton} type="button" onClick={addSeoException}>+ Add SEO Exception</button>
                  {(selected.seoExceptions || []).length > 0 && <div className={styles.checkList}>{(selected.seoExceptions || []).map((exception) => <div className={styles.medicalNote} key={exception.id}><strong>“{exception.phrase}”</strong><br /><span>{exception.rules.includes("topic-title") ? "Title" : ""}{exception.rules.includes("topic-title") && exception.rules.includes("topic-intro") ? " + " : ""}{exception.rules.includes("topic-intro") ? "Opening" : ""} · Added {exception.createdAt}</span><br /><span>{exception.reason}</span><br /><button className={styles.secondaryButton} style={{ marginTop: 8, padding: "6px 9px" }} type="button" onClick={() => removeSeoException(exception.id)}>Remove</button></div>)}</div>}
                </div></div>

                <div className={styles.sideCard}><div className={styles.cardHeader}><div><h2>Trust & Review</h2><p>Health content accountability</p></div></div><div className={styles.cardBody}><div className={styles.field}><label>Author</label><input value={selected.author} onChange={(event) => update("author", event.target.value)} /></div><div className={styles.field}><label>Clinically reviewed by</label><input value={selected.reviewedBy || ""} onChange={(event) => update("reviewedBy", event.target.value)} placeholder="Only enter a doctor who actually reviewed it" /></div><div className={styles.field}><label>Review date</label><input type="date" value={selected.reviewedAt || ""} onChange={(event) => update("reviewedAt", event.target.value)} /></div><div className={styles.medicalNote}><strong>Medical content rule:</strong> Do not add a doctor's name as reviewer unless that doctor has actually reviewed and approved the article.</div></div></div>
              </div>
            </div>
            <div className={styles.actionBar}><button className={styles.secondaryButton} type="button" disabled={saving} onClick={() => void save("draft")}>{saving ? "Saving…" : "Save Public Draft"}</button><button className={styles.secondaryButton} type="button" onClick={() => setEditorTab("preview")}>Preview</button><button className={styles.primaryButton} type="button" disabled={saving} onClick={() => void save("publish")}>{saving ? "Publishing…" : "Publish"}</button></div>
          </>}
        </section>
      </div>
    </main>
  );
}
