/**
 * Fetches a web page and returns both:
 *   - Cleaned text (for LLM extraction prompt)
 *   - Content HTML (for job description display, scripts/styles stripped)
 */

const STRIP_TAGS = [
  "script", "style", "noscript", "iframe", "svg",
];

const STRIP_CONTENT_TAGS = [
  ...STRIP_TAGS, "nav", "footer", "header", "aside", "form",
];

function buildStripPattern(tags: string[]): RegExp {
  return new RegExp(
    tags.map((tag) => `<${tag}[^>]*>[\\s\\S]*?</${tag}>`).join("|"),
    "gi"
  );
}

const STRIP_ALL_PATTERN = buildStripPattern(STRIP_CONTENT_TAGS);
const STRIP_MINIMAL_PATTERN = buildStripPattern(STRIP_TAGS);

export interface FetchedPage {
  text: string;       // Plain text for LLM prompt
  contentHtml: string; // HTML with formatting preserved (for description fallback)
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JustJobs/1.0; +https://justjobs.org)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();

  return {
    text: htmlToText(html),
    contentHtml: cleanHtml(html),
  };
}

/** Keep for backwards compat */
export async function fetchPageText(url: string): Promise<string> {
  const { text } = await fetchPage(url);
  return text;
}

/** Strip everything to plain text for LLM prompt */
function htmlToText(html: string): string {
  let text = html;
  text = text.replace(STRIP_ALL_PATTERN, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  text = text.replace(/\s+/g, " ").trim();

  if (text.length > 20000) {
    text = text.slice(0, 20000) + "\n[TRUNCATED]";
  }

  return text;
}

/** Strip scripts/styles but keep structural HTML for description display */
function cleanHtml(html: string): string {
  let content = html;
  content = content.replace(STRIP_MINIMAL_PATTERN, " ");

  if (content.length > 50000) {
    content = content.slice(0, 50000);
  }

  return content;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
