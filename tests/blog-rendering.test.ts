import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BlogBody from "@/components/BlogBody";

function render(body: string) {
  return renderToStaticMarkup(createElement(BlogBody, { body }));
}

test("blog renders consultation steps as ordered list and preserves following sections", () => {
  const html = render("## Consultation\n1. Explain **symptoms**\n2. Read [the guide](/treatments)\n\n### Questions\nDiscuss your concerns.\n- First point\n- Second point");
  assert.match(html, /<h2>Consultation<\/h2><ol start="1"><li>Explain <strong>symptoms<\/strong><\/li><li>Read <a href="\/treatments">the guide<\/a><\/li><\/ol>/);
  assert.match(html, /<h3>Questions<\/h3><p>Discuss your concerns\.<\/p><ul><li>First point<\/li><li>Second point<\/li><\/ul>/);
});

test("ordered lists support starting number and safely escape untrusted content", () => {
  const html = render('3) <script>alert(1)</script>\n4) [Unsafe](javascript:evil)\n- [Reference](https://www.ida.org.in/)\n5. Final item');
  assert.match(html, /<ol start="3">/);
  assert.match(html, /<ol start="5"><li>Final item<\/li><\/ol>/);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html, /rel="noopener noreferrer"/);
});
