import { NextResponse } from "next/server";

/**
 * Minimal styled HTML shell for the reservation decision pages.
 *
 * `heading` and `bodyHtml` are inserted verbatim, so every caller must run
 * user-supplied values through `escapeHtml` first.
 */
export function renderHtmlPage({ title, heading, bodyHtml, accent = "#dbbd82" }) {
  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${title}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background-color: #05060d;
        color: #fff;
        margin: 0;
        padding: 80px 20px;
      }
      .card {
        max-width: 600px;
        margin: 0 auto;
        background: #10121f;
        padding: 40px;
        border-radius: 10px;
        border: 1px solid #dbbd82;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        text-align: center;
      }
      h1 { color: ${accent}; font-size: 2rem; margin: 0 0 20px; }
      p { font-size: 1.1rem; line-height: 1.6; color: rgba(255, 255, 255, 0.85); }
      button {
        font: inherit;
        font-weight: 700;
        border: none;
        border-radius: 6px;
        padding: 14px 28px;
        margin-top: 24px;
        cursor: pointer;
        color: #fff;
      }
      .footer { margin-top: 40px; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${heading}</h1>
      ${bodyHtml}
      <div class="footer">Leonn Restaurant</div>
    </div>
  </body>
</html>`;
}

export function htmlResponse(html, status = 200) {
  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export function htmlErrorResponse(message, status = 400) {
  return htmlResponse(
    renderHtmlPage({
      title: "Leonn Restaurant",
      heading: "Fehler",
      bodyHtml: `<p>${message}</p>`,
      accent: "#f44336",
    }),
    status
  );
}
