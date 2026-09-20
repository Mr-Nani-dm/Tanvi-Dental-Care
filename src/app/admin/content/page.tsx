"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import BlogBody from "@/components/BlogBody";
import { CONTENT_POLICY } from "@/config/content-policy";
import { countWords as wordCount } from "@/lib/contentText";
import type { ContentFormat, ContentPackage, ContentSessionResponse, ContentSetup, DailyAnswers, TopicIdea } from "@/lib/contentTypes";
import { localSearchPhrase, topicImageConcept } from "@/lib/contentTopicPresentation";
import styles from "./ContentAdmin.module.css";

type Screen = "loading" | "login" | "setup" | "ready";
type Busy = "login" | "topics" | "generate" | "validate" | "save" | "handoff" | "image" | "logout" | null;
type Notice = { type: "success" | "error" | "info"; text: string };
type PackageResponse = { package: ContentPackage; history?: ContentPackage[]; blogUrl?: string; imagePreview?: string; stagedImage?: string; notice?: string };

const initialAnswers: DailyAnswers = { objective: "local_discovery", treatment: "auto", special: "" };
const formatOptions: { id: ContentFormat; label: string; short: string; detail: string }[] = [
  { id: "blog", label: "Patient education article", short: "Blog article", detail: `${CONTENT_POLICY.blog.preferredMinWords}–${CONTENT_POLICY.blog.preferredMaxWords} words · maximum ${CONTENT_POLICY.blog.maxWords.toLocaleString("en-IN")}` },
  { id: "gbp", label: "Google Business Profile", short: "Google post", detail: `${CONTENT_POLICY.gbp.minWords}–${CONTENT_POLICY.gbp.maxWords} words · a useful local update` },
  { id: "instagram_static", label: "Instagram post", short: "Instagram post", detail: `${CONTENT_POLICY.instagram.minCaptionWords}–${CONTENT_POLICY.instagram.maxCaptionWords} words · up to ${CONTENT_POLICY.instagram.maxHashtags} hashtags` },
  { id: "instagram_carousel", label: "Instagram carousel", short: "Carousel", detail: `Up to ${CONTENT_POLICY.instagram.maxSlides} slides · one clear lesson` },
  { id: "reel", label: "Reel script", short: "Reel script", detail: `${CONTENT_POLICY.reel.minSeconds}–${CONTENT_POLICY.reel.maxSeconds} seconds · script only` },
];
const evidenceLabels: Record<TopicIdea["evidence"]["type"], string> = {
  GSC_SIGNAL: "Search Console signal", SERP_OBSERVATION: "Observed search result", SEASONAL_OPPORTUNITY: "Seasonal opportunity", CONTENT_GAP: "Content gap", MANUAL_IDEA: "Editorial idea",
};
const checkLabels: Record<string, string> = { medical: "Medical accuracy", claims: "Claims & promises", seo: "Search usefulness", duplicate: "Originality", links: "Sources & links", words: "Length & format", brand: "Clinic facts & tone", frequency: "Posting frequency" };

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) + " IST";
}

function statusLabel(item: ContentPackage) {
  if (item.status === "handed_off") return "In Blog Manager";
  if (item.safety.status === "READY_FOR_HUMAN_REVIEW") return "Human review needed";
  if (item.safety.status === "NEEDS_REVIEW") return "Changes needed";
  return "Draft · unchecked";
}

function safeLocalUrl(value: string | undefined) {
  return value && /^\/(?!\/)[a-zA-Z0-9/?=&%_.-]*$/.test(value) ? value : undefined;
}

function exportText(item: ContentPackage, format: ContentFormat) {
  if (format === "blog" && item.blog) return `${item.blog.title}\n\n${item.blog.body}`;
  if (format === "gbp" && item.gbp) return `${item.gbp.text}\n\n${item.gbp.targetUrl}`;
  if ((format === "instagram_static" || format === "instagram_carousel") && item.instagram) {
    return [item.instagram.slides.map((slide, index) => `Slide ${index + 1}: ${slide.title}\n${slide.text}`).join("\n\n"), item.instagram.caption, item.instagram.hashtags.join(" ")].filter(Boolean).join("\n\n");
  }
  if (format === "reel" && item.reel) return [`Hook: ${item.reel.hook}`, ...item.reel.scenes.map((scene, index) => `Scene ${index + 1}\nVisual: ${scene.visual}\nVoiceover: ${scene.voiceover}`), `Caption: ${item.reel.caption}`, `Thumbnail: ${item.reel.thumbnailBrief}`, `Call to action: ${item.reel.cta}`].join("\n\n");
  return "";
}

function availableFormats(item: ContentPackage) {
  return formatOptions.filter((option) => option.id === "blog" ? !!item.blog : option.id === "gbp" ? !!item.gbp : option.id === "reel" ? !!item.reel : option.id === "instagram_static" ? item.instagram?.format === "static" : item.instagram?.format === "carousel");
}

function Icon({ name }: { name: "spark" | "check" | "arrow" | "clock" | "leaf" }) {
  const paths = {
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="m19 2 .7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7L19 2Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    leaf: <><path d="M20 4C9 2 3 8 5 15c2 6 13 5 15-11Z" /><path d="M4 21 15 10" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function ContentAdminPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [setup, setSetup] = useState<ContentSetup | null>(null);
  const [password, setPassword] = useState("");
  const [answers, setAnswers] = useState<DailyAnswers>(initialAnswers);
  const [topics, setTopics] = useState<TopicIdea[]>([]);
  const [topicNotice, setTopicNotice] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<TopicIdea | null>(null);
  const [formats, setFormats] = useState<ContentFormat[]>([]);
  const [current, setCurrent] = useState<ContentPackage | null>(null);
  const [history, setHistory] = useState<ContentPackage[]>([]);
  const [activeFormat, setActiveFormat] = useState<ContentFormat>("blog");
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);
  const [publicStorageConfirmed, setPublicStorageConfirmed] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [stagedImage, setStagedImage] = useState("");
  const [imageDisplayed, setImageDisplayed] = useState(false);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [blogUrl, setBlogUrl] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const running = useRef(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const topicsHeading = useRef<HTMLHeadingElement>(null);

  async function request<T>(path: string, payload?: unknown): Promise<T> {
    const response = await fetch(path, { method: payload === undefined ? "GET" : "POST", cache: "no-store", headers: payload === undefined ? undefined : { "Content-Type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setScreen("login");
      throw new Error("Your session has ended. Sign in again to continue.");
    }
    if (!response.ok) throw new Error(data.error || "That action could not finish. Please try again.");
    return data as T;
  }

  async function loadSession() {
    try {
      const response = await fetch("/api/admin/content/save", { cache: "no-store" });
      const data: ContentSessionResponse = await response.json().catch(() => ({}));
      if (response.status === 401) { setScreen(data.configured === false ? "setup" : "login"); return; }
      if (response.status === 503 && data.configured === false) { setScreen("setup"); return; }
      if (!response.ok) throw new Error(data.error || "Unable to open the content workspace.");
      if (!data.authenticated) { setScreen("login"); return; }
      setSetup(data.setup || null);
      setHistory(data.history || []);
      setScreen("ready");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to connect. Please try again." });
      setScreen("login");
    }
  }

  useEffect(() => { void loadSession(); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function run(action: Exclude<Busy, null>, task: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(action);
    setNotice(null);
    try { await task(); }
    catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to complete that action." }); }
    finally { running.current = false; setBusy(null); }
  }

  function confirmDiscard() {
    return !dirty || window.confirm("This draft has unsaved changes. Discard those changes and continue?");
  }

  function resetDraft() {
    if (running.current || !confirmDiscard()) return;
    setCurrent(null); setSelectedTopic(null); setTopics([]); setFormats([]); setDirty(false); setEditing(false); setNotice(null); setTopicNotice(""); setImagePreview(""); setStagedImage(""); setImageDisplayed(false); setImageUnavailable(false); setRightsConfirmed(false); setBlogUrl(""); setHistoryOpen(false);
  }

  function loadHistory(item: ContentPackage) {
    if (running.current || !confirmDiscard()) return;
    setCurrent(structuredClone(item)); setSelectedTopic(item.topic); setActiveFormat(availableFormats(item)[0]?.id || "blog"); setDirty(false); setEditing(false); setNotice(null); setImagePreview(""); setStagedImage(""); setImageDisplayed(false); setImageUnavailable(false); setRightsConfirmed(false); setBlogUrl(item.blogSlug ? `/admin/blog?draft=${encodeURIComponent(item.blogSlug)}` : ""); setHistoryOpen(false);
    requestAnimationFrame(() => reviewHeading.current?.focus());
  }

  function selectTopic(topic: TopicIdea) {
    setSelectedTopic(topic);
    const chosen = topic.recommendedFormats.filter((format) => format !== "blog" || topic.blogRecommended);
    setFormats(chosen.filter((format) => format !== "instagram_static" || !chosen.includes("instagram_carousel")));
  }

  function updateAnswers(update: Partial<DailyAnswers>) {
    setAnswers((previous) => ({ ...previous, ...update }));
    setTopics([]); setSelectedTopic(null); setFormats([]); setTopicNotice("");
  }

  function toggleFormat(format: ContentFormat) {
    setFormats((previous) => previous.includes(format) ? previous.filter((item) => item !== format) : [...previous.filter((item) => !(format === "instagram_static" && item === "instagram_carousel") && !(format === "instagram_carousel" && item === "instagram_static")), format]);
  }

  function edit(update: (item: ContentPackage) => ContentPackage) {
    if (running.current || current?.blogSlug || current?.status === "handed_off") return;
    setCurrent((previous) => previous ? { ...update(previous), status: "draft", safety: { status: "PENDING", checks: [], aiReview: null, checkedAt: null, wordCounts: {} } } : null);
    setDirty(true); setNotice(null); setBlogUrl(""); setStagedImage(""); setImagePreview(""); setImageDisplayed(false);
  }

  function applyPackage(item: ContentPackage, options?: { saved?: boolean; preview?: string }) {
    setCurrent(item); setDirty(!options?.saved); setEditing(false); setStagedImage(""); setImageDisplayed(false);
    if (options?.preview) { setImagePreview(options.preview); setImageUnavailable(false); }
    else if (!item.image) { setImagePreview(""); setImageUnavailable(false); }
    if (!availableFormats(item).some((option) => option.id === activeFormat)) setActiveFormat(availableFormats(item)[0]?.id || "blog");
  }

  async function saveDraft(action: "save" | "handoff") {
    if (!current) return;
    if (stagedImage) { setNotice({ type: "info", text: "Approve or discard the unsaved visual before saving this package." }); return; }
    await run(action, async () => {
      const data = await request<PackageResponse>("/api/admin/content/save", { package: current, publicStorageConfirmed, action });
      applyPackage(data.package, { saved: true });
      setHistory(data.history || [data.package, ...history.filter((item) => item.id !== data.package.id)]);
      setBlogUrl(safeLocalUrl(data.blogUrl) || (data.package.blogSlug ? `/admin/blog?draft=${encodeURIComponent(data.package.blogSlug)}` : ""));
      setNotice({ type: "success", text: action === "handoff" ? "Sent to Blog Manager as a draft. Open it there for clinical review and final approval." : "Draft saved. You can reopen it from your content history." });
    });
  }

  async function copyText() {
    if (!current) return;
    if (current.safety.status !== "READY_FOR_HUMAN_REVIEW" && !window.confirm("This draft has unresolved checks. Copy for editing only? Do not publish it until the checks and clinician review are complete.")) return;
    try { await navigator.clipboard.writeText(exportText(current, activeFormat)); setNotice({ type: "success", text: "Draft copied. Review and approve it before posting." }); }
    catch { setNotice({ type: "error", text: "Copy is unavailable in this browser. Select the preview text and copy it manually." }); }
  }

  const ready = current?.safety.status === "READY_FOR_HUMAN_REVIEW";
  const handedOff = Boolean(current?.blogSlug || current?.status === "handed_off");
  const completedChecks = current?.safety.checks.filter((check) => check.status === "PASS").length || 0;
  const step = current ? 3 : topics.length ? 2 : 1;
  const allFormats = current ? availableFormats(current) : [];
  const currentImage = imagePreview || safeLocalUrl(current?.image?.path);

  const noticeElement = notice && <div role={notice.type === "error" ? "alert" : "status"} className={`${styles.notice} ${styles[notice.type]}`}>{notice.text}</div>;
  const brand = <div className={styles.brand}><img src="/images/tanvi-logo-web.png" alt="" width="42" height="42" /><div><strong>TANVI DENTAL</strong><span>Content OS <b>V1</b></span></div></div>;

  if (screen !== "ready") return <main className={styles.page}><div className={styles.authShell}><div className={styles.authCard}>{brand}<span className={styles.eyebrow}>A little clarity. Better patient content.</span><h1>{screen === "loading" ? "Opening your workspace…" : screen === "setup" ? "Your workspace needs setup" : "Welcome to Content OS"}</h1><p>{screen === "setup" ? "A website administrator needs to connect the existing clinic login and content storage before you can sign in." : "Useful, locally relevant dental content, with a clear review step before anything is published."}</p>{noticeElement}{screen === "login" && <form onSubmit={(event) => { event.preventDefault(); void run("login", async () => { const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); const data = await response.json().catch(() => ({})); if (response.status === 503) { setScreen("setup"); return; } if (!response.ok) throw new Error(data.error || "Unable to sign in."); setPassword(""); await loadSession(); }); }} className={styles.loginForm}><Field label="Clinic admin password"><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={!!busy} /></Field><button className={styles.primaryButton} disabled={!!busy} type="submit">{busy === "login" ? "Signing in…" : "Sign in"}<Icon name="arrow" /></button></form>}{screen === "setup" && <><p className={styles.subtle}>Use the same server-side credentials as Blog Manager. Keep passwords and API keys out of this page.</p><a className={styles.secondaryButton} href="/admin/blog">Open Blog Manager setup</a><button className={styles.textButton} onClick={() => void loadSession()}>Check setup again</button></>}<a className={styles.backLink} href="/">Back to Tanvi Dental</a></div></div></main>;

  return <main className={styles.page}>
    <header className={styles.topbar}><div className={styles.topbarInner}>{brand}<nav className={styles.topActions} aria-label="Admin navigation"><a href="/admin/blog">Blog Manager <span aria-hidden="true">↗</span></a><button type="button" disabled={!!busy} onClick={() => { if (!confirmDiscard()) return; void run("logout", async () => { await request("/api/admin/logout", {}); setDirty(false); setCurrent(null); setHistory([]); setScreen("login"); }); }}>{busy === "logout" ? "Signing out…" : "Sign out"}</button></nav></div></header>
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.workspaceLabel}><span className={styles.workspaceDot} /> Mangalagiri workspace</div>
        <button className={styles.newButton} type="button" onClick={resetDraft} disabled={!!busy}><span aria-hidden="true">＋</span> New content brief</button>
        <ol className={styles.steps} aria-label="Content creation progress">{["Your daily brief", "Choose one topic", "Review your content"].map((label, index) => <li className={step === index + 1 ? styles.stepCurrent : step > index + 1 ? styles.stepDone : ""} key={label} aria-current={step === index + 1 ? "step" : undefined}><span>{step > index + 1 ? <Icon name="check" /> : String(index + 1).padStart(2, "0")}</span><div>{label}<small>{["Three simple questions", "Evidence, not guesswork", "Check, save, hand off"][index]}</small></div></li>)}</ol>
        <button type="button" className={styles.historyHeading} onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen} aria-controls="content-history"><span><Icon name="clock" /> Saved history</span><b>{history.length}</b><span className={styles.mobileOnly} aria-hidden="true">{historyOpen ? "−" : "+"}</span></button>
        <div id="content-history" className={`${styles.historyList} ${historyOpen ? styles.historyOpen : ""}`}>{history.length ? [...history].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((item) => <button type="button" disabled={!!busy} className={`${styles.historyItem} ${current?.id === item.id ? styles.historyActive : ""}`} onClick={() => loadHistory(item)} key={item.id}><strong>{item.topic.title}</strong><span>{statusLabel(item)}</span><small>{displayDate(item.updatedAt)}</small></button>) : <p className={styles.emptyHistory}>Your saved drafts will appear here.</p>}</div>
        <div className={styles.sidebarNote}><Icon name="leaf" /><p>Helpful to patients.<br />Relevant to Mangalagiri.<br />Reviewed by people.</p></div>
      </aside>
      <section className={styles.content} aria-label="Content workspace" aria-busy={!!busy}>
        <div className={styles.intro}><div><span className={styles.eyebrow}>TANVI CONTENT STUDIO</span><h1>{current ? "Make every word useful." : "What should we share today?"}</h1><p>{current ? "Review each format, check the evidence, and save when you’re ready." : "Turn a simple clinic brief into clear, thoughtful patient education."}</p></div><span className={styles.draftBadge}>Draft workspace</span></div>
        {setup?.preview && <div className={styles.previewBanner}><strong>Preview workspace</strong><span>Changes stay on this preview branch. Production release needs approval.</span></div>}
        {setup && (!setup.textReady || !setup.storageReady) && <div className={styles.setupBanner}><h2>One-time connection needed</h2><p>{!setup.textReady ? "Topic suggestions and content generation need the clinic’s AI connection." : "Saving needs the clinic’s content storage connection."} An administrator can configure this workspace. Existing saved drafts remain available below.</p>{setup.missing.length > 0 && <details><summary>Administrator setup details</summary><p>Add these server-side settings for this preview:</p><ul>{setup.missing.map((item) => <li key={item}><code>{item}</code></li>)}</ul><p>Never put API keys in questionnaire answers or public files.</p></details>}</div>}
        {noticeElement}
        {busy && <div className={styles.busyNotice} role="status"><span className={styles.spinner} />{({ login: "Signing in…", topics: "Checking existing content and finding three useful angles…", generate: "Writing your drafts, then checking them with a separate reviewer…", validate: "Rechecking your edits, sources, and content limits…", save: "Saving your draft…", handoff: "Creating a Blog Manager draft…", image: "Preparing your optional illustration. This may take a minute…", logout: "Signing out…" } as Record<Exclude<Busy, null>, string>)[busy]}</div>}

        {!current && <>
          <section className={styles.card} aria-labelledby="brief-heading"><div className={styles.cardHeading}><span className={styles.sectionNumber}>01</span><div><h2 id="brief-heading">A three-question brief</h2><p>Choose a direction, or let the system suggest one.</p></div></div><form onSubmit={(event) => { event.preventDefault(); void run("topics", async () => { const data = await request<{ topics: TopicIdea[]; notice: string }>("/api/admin/content/topics", { answers }); if (data.topics.length !== CONTENT_POLICY.topicCount) throw new Error("Three distinct topics could not be prepared. Please try a different brief."); setTopics(data.topics); setTopicNotice(data.notice); setSelectedTopic(null); setFormats([]); requestAnimationFrame(() => topicsHeading.current?.focus()); }); }}><fieldset className={styles.briefForm} disabled={!!busy}><div className={styles.twoColumns}><Field label="1. What would you like this content to do?"><select value={answers.objective} onChange={(event) => updateAnswers({ objective: event.target.value as DailyAnswers["objective"] })}><option value="auto">Recommend a direction for me</option><option value="local_discovery">Help local patients find us</option><option value="patient_education">Answer a patient’s question</option><option value="treatment_awareness">Explain a treatment</option><option value="doctor_trust">Build trust in our doctors</option><option value="preventive_care">Encourage preventive care</option></select></Field><Field label="2. Any treatment to focus on?"><select value={answers.treatment} onChange={(event) => updateAnswers({ treatment: event.target.value as DailyAnswers["treatment"] })}><option value="auto">Choose for me</option><option value="root-canal-treatment">Root canal treatment</option><option value="dental-implants">Dental implants</option><option value="wisdom-tooth-management">Wisdom tooth care</option><option value="teeth-cleaning-and-scaling">Cleaning & scaling</option><option value="general-dental-care">General dental care</option></select></Field></div><Field label="3. Anything special today?" hint="Optional. A clinic update, an awareness day, a local festival—or leave it blank. Do not enter patient names, contact details, health records, or private information."><textarea value={answers.special} onChange={(event) => updateAnswers({ special: event.target.value })} rows={3} maxLength={CONTENT_POLICY.specialMaxCharacters} placeholder="For example: We’d like to explain what happens during a first dental visit." /></Field><div className={styles.formFooter}><p><Icon name="leaf" /> Original content, grounded in clinic facts.</p><button type="submit" className={styles.primaryButton} disabled={!!busy || !setup?.textReady}>{busy === "topics" ? "Finding ideas…" : topics.length ? "Refresh the three ideas" : "Find three useful ideas"}<Icon name="arrow" /></button></div></fieldset></form></section>

          {topics.length === CONTENT_POLICY.topicCount && <section className={styles.topicSection} aria-labelledby="topics-heading"><div className={styles.cardHeading}><span className={styles.sectionNumber}>02</span><div><h2 id="topics-heading" ref={topicsHeading} tabIndex={-1}>Choose a niche topic for Mangalagiri</h2><p>Compare the patient question, local search focus and image concept for each idea.</p></div></div>{topicNotice && <p className={styles.topicNotice}>{topicNotice}</p>}<div className={styles.topicGrid} role="radiogroup" aria-label="Topic ideas">{topics.map((topic, index) => <label className={`${styles.topicCard} ${selectedTopic?.id === topic.id ? styles.topicSelected : ""}`} key={topic.id}><input type="radio" name="topic" value={topic.id} checked={selectedTopic?.id === topic.id} onChange={() => selectTopic(topic)} disabled={!!busy || topic.duplicate.status === "DUPLICATE"} /><div className={styles.topicCardTop}><span>IDEA {String(index + 1).padStart(2, "0")}</span><span className={styles.radioMark}>{selectedTopic?.id === topic.id && <Icon name="check" />}</span></div><span className={styles.evidenceTag}>{evidenceLabels[topic.evidence.type]}</span><h3>{topic.title}</h3><p>{topic.rationale}</p><div className={styles.topicDetail}><strong>Specific patient question / angle</strong><p>{topic.angle}</p><strong>Suggested local search phrase</strong><p>{localSearchPhrase(topic)}</p><small>Planning suggestion · search demand not measured</small><p><strong>Patient intent:</strong> {topic.intent}</p><p><strong>Treatment page:</strong> {topic.targetPage}</p></div><div className={styles.topicDetail}><strong>Image concept for this topic</strong><p>{topicImageConcept(topic)}</p><small>Generate the image after this topic’s text checks pass.</small></div><div className={styles.topicDetail}><strong>Why this idea</strong><p>{topic.evidence.reason}</p></div><div className={styles.topicDetail}><strong>{topic.duplicate.status === "NEW" ? "A fresh angle" : "Related content exists"}</strong><p>{topic.duplicate.reason}</p></div><div className={styles.topicFormats}>{topic.recommendedFormats.map((format) => <span key={format}>{formatOptions.find((option) => option.id === format)?.short}</span>)}</div></label>)}</div>
            {selectedTopic && <div className={styles.formatCard}><h3>Where will this idea be most helpful?</h3><p>{selectedTopic.blogRecommended ? "This topic has enough depth for an article. Choose the formats you need." : "This idea is better suited to a short post or an update to existing content. A new blog is not recommended."}</p>{selectedTopic.duplicate.matchedTitle && <p className={styles.subtle}>Related article: {selectedTopic.duplicate.matchedTitle}</p>}<fieldset disabled={!!busy} className={styles.formatOptions}><legend className={styles.srOnly}>Choose content formats</legend>{formatOptions.map((option) => <label key={option.id} className={`${styles.formatOption} ${formats.includes(option.id) ? styles.formatSelected : ""} ${option.id === "blog" && !selectedTopic.blogRecommended ? styles.formatDisabled : ""}`}><input type="checkbox" checked={formats.includes(option.id)} onChange={() => toggleFormat(option.id)} disabled={option.id === "blog" && !selectedTopic.blogRecommended} /><span><strong>{option.label}</strong><small>{option.detail}</small></span>{selectedTopic.recommendedFormats.includes(option.id) && <b>Suggested</b>}</label>)}</fieldset><p className={styles.subtle}>Every topic includes an image brief. After creating and checking the text, use Create image for this topic in the review step. Choose a static Instagram post or a carousel; reel output is a script only.</p><div className={styles.formFooter}><p>Saving a draft reserves a slot in the weekly and monthly plan.</p><button className={styles.primaryButton} type="button" disabled={!formats.length || !!busy || !setup?.textReady} onClick={() => void run("generate", async () => { const data = await request<PackageResponse>("/api/admin/content/generate", { topic: selectedTopic, formats }); applyPackage(data.package); if (data.notice) setNotice({ type: "info", text: data.notice }); setImagePreview(""); setStagedImage(""); setImageDisplayed(false); setImageUnavailable(false); setRightsConfirmed(false); setBlogUrl(""); requestAnimationFrame(() => reviewHeading.current?.focus()); })}><Icon name="spark" />{busy === "generate" ? "Writing & checking…" : "Create content drafts"}</button></div></div>}
          </section>}
        </>}

        {current && <>
          <section className={styles.reviewHeader}><div><span className={styles.eyebrow}>03 / REVIEW YOUR CONTENT</span><h2 ref={reviewHeading} tabIndex={-1}>{current.topic.title}</h2><p><span className={styles.evidenceTag}>{evidenceLabels[current.topic.evidence.type]}</span><span className={styles.subtle}>{current.topic.evidence.reason}</span></p></div><div className={styles.reviewMeta}><span className={styles.statusPill}>{statusLabel(current)}</span><small>{dirty ? "Unsaved changes" : `Saved ${displayDate(current.updatedAt)}`}</small></div></section>
          {handedOff && <div className={styles.previewBanner}><strong>Saved handoff snapshot</strong><span>This package is now in Blog Manager. Continue editing and reviewing the article there.</span></div>}<div className={styles.reviewLayout}>
            <div className={styles.previewColumn}>
              <section className={styles.card} aria-label="Platform previews"><div className={styles.previewToolbar}><div className={styles.previewTabs} role="tablist" aria-label="Content formats">{allFormats.map((option) => <button type="button" role="tab" id={`tab-${option.id}`} tabIndex={activeFormat === option.id ? 0 : -1} onKeyDown={(event) => { const index = allFormats.findIndex((entry) => entry.id === option.id); let next = index; if (event.key === "ArrowRight") next = (index + 1) % allFormats.length; else if (event.key === "ArrowLeft") next = (index + allFormats.length - 1) % allFormats.length; else if (event.key === "Home") next = 0; else if (event.key === "End") next = allFormats.length - 1; else return; event.preventDefault(); setActiveFormat(allFormats[next].id); document.getElementById(`tab-${allFormats[next].id}`)?.focus(); }} aria-selected={activeFormat === option.id} aria-controls={`panel-${option.id}`} className={activeFormat === option.id ? styles.tabActive : ""} key={option.id} onClick={() => setActiveFormat(option.id)}>{option.short}</button>)}</div><div className={styles.previewActions}><button className={styles.textButton} type="button" disabled={!!busy || handedOff} onClick={() => setEditing(!editing)}>{editing ? "Show preview" : "Edit text"}</button><button className={styles.textButton} type="button" onClick={() => void copyText()} disabled={!!busy}>Copy draft</button></div></div><div role="tabpanel" tabIndex={0} id={`panel-${activeFormat}`} aria-labelledby={`tab-${activeFormat}`} className={styles.platformPreview}>
                {editing && <div className={styles.editNotice}>Edits need fresh checks before the image or Blog Manager handoff is available.</div>}
                {activeFormat === "blog" && current.blog && <>{editing ? <div className={styles.editFields}><Field label="Article title"><input value={current.blog.title} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, title: event.target.value } }))} disabled={!!busy} /></Field><Field label="Article URL" hint={current.blogSlug ? "This URL is fixed after handoff to Blog Manager." : "Choose a short, clear URL using lowercase words separated by hyphens."}><input value={current.blog.slug} readOnly={!!current.blogSlug} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, slug: event.target.value } }))} disabled={!!busy} /></Field><Field label="Short description"><textarea value={current.blog.excerpt} rows={3} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, excerpt: event.target.value } }))} disabled={!!busy} /></Field><Field label="Article text" hint="Use ## for section headings and ### for smaller headings. The article title provides the main heading."><textarea className={styles.articleEditor} value={current.blog.body} rows={18} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, body: event.target.value } }))} disabled={!!busy} /></Field><Field label="Article call to action" hint="Use this wording once in the article body. Update the body to match if you change it."><input value={current.blog.cta} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, cta: event.target.value } }))} disabled={!!busy} /></Field><Field label="Primary search topic"><input value={current.blog.primaryTopic} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, primaryTopic: event.target.value } }))} disabled={!!busy} /></Field><Field label="Search title"><input maxLength={CONTENT_POLICY.blog.maxSeoTitleCharacters} value={current.blog.seoTitle} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, seoTitle: event.target.value } }))} disabled={!!busy} /></Field><Field label="Search description"><textarea maxLength={CONTENT_POLICY.blog.maxMetaDescriptionCharacters} value={current.blog.metaDescription} rows={3} onChange={(event) => edit((item) => ({ ...item, blog: item.blog && { ...item.blog, metaDescription: event.target.value } }))} disabled={!!busy} /></Field></div> : <article className={styles.articlePreview}><span className={styles.eyebrow}>PATIENT EDUCATION · DRAFT</span><h3>{current.blog.title}</h3><p className={styles.articleLead}>{current.blog.excerpt}</p><BlogBody body={current.blog.body} /></article>}<div className={styles.wordCounter}><span>{wordCount(`${current.blog.title} ${current.blog.body}`)} total words</span><span>Target {CONTENT_POLICY.blog.preferredMinWords}–{CONTENT_POLICY.blog.preferredMaxWords} · maximum {CONTENT_POLICY.blog.maxWords.toLocaleString("en-IN")} including the title</span></div><details className={styles.searchDetails}><summary>Search result preview</summary><div className={styles.searchPreview}><small>tanvidental.in › blog › {current.blog.slug}</small><strong>{current.blog.seoTitle}</strong><p>{current.blog.metaDescription}</p></div></details></>}
                {activeFormat === "gbp" && current.gbp && <>{editing ? <div className={styles.editFields}><Field label="Google Business Profile post"><textarea rows={6} value={current.gbp.text} onChange={(event) => edit((item) => ({ ...item, gbp: item.gbp && { ...item.gbp, text: event.target.value } }))} disabled={!!busy} /></Field></div> : <div className={styles.googlePost}><div className={styles.socialBrand}><img src="/images/tanvi-logo-web.png" alt="" width="38" height="38" /><div><strong>Tanvi Dental Care & Implant Centre</strong><span>Mangalagiri · Draft update</span></div></div><p>{current.gbp.text}</p><span className={styles.previewCta}>{current.gbp.cta}</span><small>Destination: {current.gbp.targetUrl}</small></div>}<div className={styles.wordCounter}><span>{wordCount(current.gbp.text)} words</span><span>{CONTENT_POLICY.gbp.minWords}–{CONTENT_POLICY.gbp.maxWords} words</span></div></>}
                {(activeFormat === "instagram_static" || activeFormat === "instagram_carousel") && current.instagram && <><div className={styles.socialBrand}><span className={styles.instagramAvatar}>T</span><div><strong>tanvidental</strong><span>Instagram {current.instagram.format === "carousel" ? "carousel" : "post"} · Draft</span></div></div>{current.instagram.format === "carousel" && <div className={styles.carousel}>{current.instagram.slides.map((slide, index) => <div className={styles.slide} key={index}><span className={styles.slideNumber}>{index + 1} / {current.instagram!.slides.length}</span>{editing ? <><Field label={`Slide ${index + 1} title`}><input value={slide.title} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, instagram: item.instagram && { ...item.instagram, slides: item.instagram.slides.map((entry, slideIndex) => slideIndex === index ? { ...entry, title: event.target.value } : entry) } }))} /></Field><Field label={`Slide ${index + 1} text`}><textarea value={slide.text} rows={4} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, instagram: item.instagram && { ...item.instagram, slides: item.instagram.slides.map((entry, slideIndex) => slideIndex === index ? { ...entry, text: event.target.value } : entry) } }))} /></Field></> : <><h3>{slide.title}</h3><p>{slide.text}</p></>}<span className={styles.slideBrand}>TANVI DENTAL · MANGALAGIRI</span></div>)}</div>}{editing ? <div className={styles.editFields}><Field label="Instagram caption"><textarea rows={6} value={current.instagram.caption} onChange={(event) => edit((item) => ({ ...item, instagram: item.instagram && { ...item.instagram, caption: event.target.value } }))} disabled={!!busy} /></Field><Field label="Hashtags" hint={`Separate with spaces; maximum ${CONTENT_POLICY.instagram.maxHashtags}.`}><input value={current.instagram.hashtags.join(" ")} onChange={(event) => edit((item) => ({ ...item, instagram: item.instagram && { ...item.instagram, hashtags: event.target.value.split(/\s+/).filter(Boolean) } }))} disabled={!!busy} /></Field></div> : <div className={styles.caption}><p>{current.instagram.caption}</p><p className={styles.hashtags}>{current.instagram.hashtags.join(" ")}</p></div>}<div className={styles.wordCounter}><span>{wordCount(current.instagram.caption)} caption words · {current.instagram.hashtags.length} hashtags</span><span>{current.instagram.format === "static" ? `${CONTENT_POLICY.instagram.minCaptionWords}–${CONTENT_POLICY.instagram.maxCaptionWords} words` : `${current.instagram.slides.length} of ${CONTENT_POLICY.instagram.maxSlides} slides`}</span></div></>}
                {activeFormat === "reel" && current.reel && <div className={styles.reelPreview}><div className={styles.reelHeading}><h3>A clear story, in a short reel.</h3><span>{current.reel.durationSeconds}s · Script only</span></div>{editing ? <Field label="Opening hook"><textarea rows={2} value={current.reel.hook} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, hook: event.target.value } }))} /></Field> : <div className={styles.hook}><small>OPENING HOOK</small><p>{current.reel.hook}</p></div>}<ol className={styles.scenes}>{current.reel.scenes.map((scene, index) => <li key={index}><span className={styles.sceneNumber}>{String(index + 1).padStart(2, "0")}</span><div>{editing ? <><Field label={`Scene ${index + 1} visual`}><textarea rows={2} value={scene.visual} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, scenes: item.reel.scenes.map((entry, sceneIndex) => sceneIndex === index ? { ...entry, visual: event.target.value } : entry) } }))} /></Field><Field label={`Scene ${index + 1} voiceover`}><textarea rows={3} value={scene.voiceover} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, scenes: item.reel.scenes.map((entry, sceneIndex) => sceneIndex === index ? { ...entry, voiceover: event.target.value } : entry) } }))} /></Field></> : <><strong>Visual</strong><p>{scene.visual}</p><strong>Voiceover</strong><p>{scene.voiceover}</p></>}</div></li>)}</ol>{editing ? <><Field label="Reel caption"><textarea rows={3} value={current.reel.caption} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, caption: event.target.value } }))} /></Field><Field label="Thumbnail brief"><textarea rows={2} value={current.reel.thumbnailBrief} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, thumbnailBrief: event.target.value } }))} /></Field><Field label="Call to action"><input value={current.reel.cta} disabled={!!busy} onChange={(event) => edit((item) => ({ ...item, reel: item.reel && { ...item.reel, cta: event.target.value } }))} /></Field></> : <><div className={styles.reelDetail}><strong>Caption</strong><p>{current.reel.caption}</p></div><div className={styles.reelDetail}><strong>Thumbnail direction</strong><p>{current.reel.thumbnailBrief}</p></div><div className={styles.reelDetail}><strong>Call to action</strong><p>{current.reel.cta}</p></div></>}<div className={styles.wordCounter}><span>{wordCount([current.reel.hook, ...current.reel.scenes.map((scene) => scene.voiceover), current.reel.cta].join(" "))} spoken words</span><span>{CONTENT_POLICY.reel.minSeconds}–{CONTENT_POLICY.reel.maxSeconds} seconds · {CONTENT_POLICY.frequency.reel.weekly} reel a week</span></div></div>}
              </div></section>

              <section className={styles.card} aria-labelledby="image-heading"><div className={styles.cardHeading}><span className={styles.smallIcon}><Icon name="spark" /></span><div><h2 id="image-heading">Image for this topic</h2><p>{current.imageBrief.kind === "doctor" ? "Use an approved real doctor portrait." : "A simple educational illustration to support the idea."}</p><span className={styles.optionalTag}>Optional</span></div></div><div className={styles.cardBody}>{(current.image || stagedImage) && currentImage && !imageUnavailable ? <figure className={styles.generatedImage}><img src={currentImage} alt={current.image?.alt || current.imageBrief.alt} onLoad={() => setImageDisplayed(true)} onError={() => setImageUnavailable(true)} /><figcaption>{(stagedImage || current.image?.provenance === "AI_GENERATED") ? "AI-generated illustration" : "Approved clinic doctor photo"} · Check accuracy, labels, and suitability before use.</figcaption></figure> : current.image ? <div className={styles.imagePending}><strong>Visual saved</strong><p>The preview image will appear after the preview rebuild. You can continue saving this draft.</p><small>{current.image.alt}</small></div> : <div className={styles.imageBrief}><span aria-hidden="true">✧</span><p>{current.imageBrief.description}</p></div>}<p className={styles.subtle}>Image description: {current.imageBrief.alt}</p>{!publicStorageConfirmed && <p className={styles.subtle}>Confirm public storage in the save panel below to prepare a visual.</p>}{!ready && <p className={styles.subtle}>Image creation is locked because the text checks have not passed. Use Fix failed checks, then create the visual.</p>}{!setup?.imageReady && current.imageBrief.kind !== "doctor" && <p className={styles.subtle}>Image generation needs an administrator to configure the image provider.</p>}<label className={styles.checkLabel}><input type="checkbox" checked={rightsConfirmed} disabled={!!busy} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I’m authorised to use the visual inputs and will review the result before publication. No patient image or private information is included.</span></label><button type="button" className={styles.secondaryButton} disabled={!!busy || handedOff || !ready || !publicStorageConfirmed || !rightsConfirmed || !setup?.storageReady || (!setup?.imageReady && current.imageBrief.kind !== "doctor")} onClick={() => void run("image", async () => { const data = await request<PackageResponse>("/api/admin/content/image", { package: current, publicStorageConfirmed, rightsConfirmed }); applyPackage(data.package, { preview: data.imagePreview }); setStagedImage(data.stagedImage || ""); setNotice({ type: "info", text: data.stagedImage ? "Visual generated in this browser only. Review it below before approving public storage. It expires in 30 minutes." : "Doctor photo selected. Review its suitability before publication." }); })}>{busy === "image" ? "Preparing visual…" : current.image ? "Prepare another visual" : current.imageBrief.kind === "doctor" ? "Use approved doctor photo" : "Create image for this topic"}</button>{stagedImage && <div className={styles.imageBrief}><p>This image has not been saved publicly. Check its anatomy, identity, branding, rights and description. Approval saves these exact pixels to the public repository.</p><button type="button" className={styles.primaryButton} disabled={!!busy || !imageDisplayed || imageUnavailable || !publicStorageConfirmed || !rightsConfirmed || !ready} onClick={() => void run("image", async () => { const preview = imagePreview; const data = await request<PackageResponse>("/api/admin/content/image/approve", { package: current, stagedImage, imageBase64: preview.split(",")[1], publicStorageConfirmed, rightsConfirmed, visualApproved: true }); applyPackage(data.package, { preview }); setNotice({ type: "success", text: "The reviewed image is now saved publicly. Save this package to retain it in history." }); })}>I reviewed this image — approve public storage</button><button type="button" className={styles.textButton} disabled={!!busy} onClick={() => { setStagedImage(""); setImagePreview(""); setImageDisplayed(false); }}>Discard this image</button></div>}</div></section>
            </div>

            <aside className={styles.reviewSidebar} aria-label="Draft checks and sources"><section className={styles.safetyCard}><div className={styles.safetyHeading}><span className={`${styles.safetyIcon} ${ready ? styles.safetyReady : ""}`}>{ready ? <Icon name="check" /> : "!"}</span><div><h2>{ready ? "Ready for a human review" : current.safety.status === "PENDING" ? "Checks needed" : "A few things need attention"}</h2><p>{current.safety.checks.length ? `${completedChecks} of ${current.safety.checks.length} checks passed` : "Validate this draft before continuing."}</p></div></div><p className={styles.humanNote}>Automated checks support your review. A qualified dentist must review medical content before publication. No clinical sign-off is implied.</p><div className={styles.checks}>{current.safety.checks.map((check) => <details key={check.key} className={styles.checkRow} open={check.status !== "PASS"}><summary><span className={check.status === "PASS" ? styles.checkPass : styles.checkWarning}>{check.status === "PASS" ? "✓" : "!"}</span><strong>{checkLabels[check.key] || check.key}</strong><small>{check.status === "PASS" ? "Passed" : "Review"}</small></summary><ul>{check.messages.map((message, index) => <li key={index}>{message}</li>)}</ul></details>)}</div>{current.safety.aiReview ? <details className={styles.aiReview}><summary>Separate AI review completed</summary>{current.safety.aiReview.issues.length ? <ul>{current.safety.aiReview.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul> : <p>No additional issues were reported by the AI reviewer. Human review is still required.</p>}</details> : <p className={styles.subtle}>A separate AI review has not completed for this version.</p>}<button className={styles.secondaryButton} type="button" disabled={!!busy || handedOff || !setup?.textReady} onClick={() => void run("validate", async () => { const data = await request<PackageResponse>("/api/admin/content/validate", { package: current }); applyPackage(data.package); setNotice({ type: data.package.safety.status === "READY_FOR_HUMAN_REVIEW" ? "success" : "info", text: data.notice || (data.package.safety.status === "READY_FOR_HUMAN_REVIEW" ? "Automated checks complete. This draft still needs a human review before publication." : "Checks updated. Review the flagged items and edit the draft as needed.") }); })}>{busy === "validate" ? "Checking…" : current.safety.status === "PENDING" ? "Check this draft" : "Run checks again"}</button>{!ready && <button className={styles.secondaryButton} type="button" disabled={!!busy || handedOff || !setup?.textReady} onClick={() => void run("validate", async () => { const data = await request<PackageResponse>("/api/admin/content/validate", { package: current, repair: true }); applyPackage(data.package); setNotice({ type: "info", text: data.notice || "Checks refreshed. Review the remaining items." }); })}>Fix failed checks</button>}{current.safety.checkedAt && <small className={styles.checkedAt}>Checked {displayDate(current.safety.checkedAt)}</small>}</section>
              <section className={styles.sourcesCard}><h2>Evidence & sources</h2><p>Sources checked for this draft. A working link alone does not verify every medical statement.</p>{current.sources.length ? <ul>{current.sources.map((source) => <li key={source.id}><a href={/^https:\/\//.test(source.url) ? source.url : undefined} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a><small>Retrieved {displayDate(source.retrievedAt)}</small><details><summary>Source extract</summary><p>{source.excerpt}</p></details></li>)}</ul> : <p className={styles.subtle}>No verified source is attached yet. Link checks must pass before handoff.</p>}<details className={styles.topicReason}><summary>Topic and duplication checks</summary><p><strong>Search topic:</strong> {current.topic.primaryKeyword}</p><p><strong>Intent:</strong> {current.topic.intent}</p><p><strong>Angle:</strong> {current.topic.angle}</p><p><strong>{current.topic.duplicate.status.replaceAll("_", " ")}:</strong> {current.topic.duplicate.reason}</p></details></section>
            </aside>
          </div>

          <section className={styles.savePanel} aria-labelledby="save-heading"><div><h2 id="save-heading">Keep your draft. Choose the next step.</h2><p>Saving keeps the package in history. Blog Manager handles the final article review and publishing.</p><label className={styles.checkLabel}><input type="checkbox" checked={publicStorageConfirmed} disabled={!!busy} onChange={(event) => setPublicStorageConfirmed(event.target.checked)} /><span>I understand drafts and images are stored in a <strong>public GitHub repository</strong> and may remain in its history. This content contains no patient or confidential information.</span></label></div><div className={styles.saveActions}><span className={styles.unsavedLabel}>{dirty ? "● Unsaved changes" : "Saved in content history"}</span><button className={styles.secondaryButton} type="button" disabled={!!busy || handedOff || !publicStorageConfirmed || !setup?.storageReady} onClick={() => void saveDraft("save")}>{busy === "save" ? "Saving…" : "Save draft to history"}</button>{current.blog && <button className={styles.primaryButton} type="button" disabled={!!busy || handedOff || !ready || !publicStorageConfirmed || !setup?.storageReady} onClick={() => void saveDraft("handoff")}>{busy === "handoff" ? "Creating draft…" : "Send draft to Blog Manager"}<Icon name="arrow" /></button>}{blogUrl && <a className={styles.savedBlogLink} href={blogUrl}>Open draft in Blog Manager ↗</a>}{current.blog && !ready && <small>Resolve the flagged checks before sending.</small>}</div></section>
        </>}
        <footer className={styles.workspaceFooter}>Tanvi Dental Care & Implant Centre <span>·</span> Mangalagiri, Andhra Pradesh <span>·</span> Human approval before publishing</footer>
      </section>
    </div>
  </main>;
}
