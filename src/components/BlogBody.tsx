import type { ReactNode } from "react";
import { isApprovedArticleImage } from "@/lib/articleImages";

function safeHref(value: string) {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https:\/\//i.test(href)) return href;
  if (/^(mailto:|tel:)/i.test(href)) return href;
  return "#";
}

function safeImageSrc(value: string) {
  const src = value.trim();
  if (isApprovedArticleImage(src)) return src;
  return "";
}

function inline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (href === "#") return <span key={`${token}-${index}`}>{link[1]}</span>;
      const external = /^https:\/\//i.test(href);
      return <a key={`${token}-${index}`} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{link[1]}</a>;
    }
    return token;
  });
}

export default function BlogBody({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];
  let listStart = 1;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) blocks.push(<p key={`p-${blocks.length}`}>{inline(text)}</p>);
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(<ul key={`ul-${blocks.length}`}>{bullets.map((item, index) => <li key={`${item}-${index}`}>{inline(item)}</li>)}</ul>);
    bullets = [];
  };

  const flushNumbered = () => {
    if (!numbered.length) return;
    blocks.push(<ol start={listStart} key={`ol-${blocks.length}`}>{numbered.map((item, index) => <li key={`${item}-${index}`}>{inline(item)}</li>)}</ol>);
    numbered = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      return;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      const src = safeImageSrc(image[2]);
      if (src) {
        blocks.push(
          <figure className="blog-inline-image" key={`img-${blocks.length}`}>
            <img src={src} alt={image[1]} loading="lazy" decoding="async" />
            {image[1] && <figcaption>{image[1]}</figcaption>}
          </figure>,
        );
      }
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      blocks.push(<h3 key={`h3-${blocks.length}`}>{inline(line.slice(4))}</h3>);
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      blocks.push(<h2 key={`h2-${blocks.length}`}>{inline(line.slice(3))}</h2>);
      return;
    }

    const ordered = line.match(/^(\d{1,6})[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      flushBullets();
      if (!numbered.length) listStart = Number(ordered[1]);
      numbered.push(ordered[2]);
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushNumbered();
      bullets.push(line.slice(2));
      return;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{inline(line.slice(2))}</blockquote>);
      return;
    }

    flushBullets();
    flushNumbered();
    paragraph.push(line);
  });

  flushParagraph();
  flushBullets();
  flushNumbered();

  return <div className="blog-body">{blocks}</div>;
}
