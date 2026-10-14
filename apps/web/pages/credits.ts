// The credits page, in each explanation language, the one place that names the content's authors, both
// licences and how to credit the content; every page's top bar links to the one in its language.
import { type Explain, say, SITE } from "../../../scripts/lib.ts";
import { alternates, type Context, EXPLAINS } from "../context.ts";
import { page } from "../layout.ts";
import { escapeHtml } from "../html.ts";
import { creditsUrl } from "../urls.ts";

const link = (href: string, text: string, attrs = ""): string => `<a href="${escapeHtml(href)}"${attrs}>${escapeHtml(text)}</a>`;

export function creditsPage(ctx: Context): void {
  for (const e of EXPLAINS) creditsIn(ctx, e);
}

function creditsIn(ctx: Context, e: Explain): void {
  const { o } = ctx;
  const site = SITE.name;
  const { content, code } = SITE.licences;
  const words = (key: string): string => escapeHtml(say(key, e, { site }));
  const authors = words("creditsAuthors").replace("{credit}", link(`${SITE.repository}/graphs/contributors`, SITE.credit));
  const licences = [
    `<li>${words("contentLicence")}: ${link(content.url, content.name, ' rel="license"')}</li>`,
    `<li>${words("codeLicence")}: ${link(code.url, code.name)}</li>`,
  ];
  const contribute = [
    `<li>${link(SITE.repository, say("sourceLink", e))}</li>`,
    `<li>${link(`${SITE.repository}/issues/new?template=report-a-mistake.yml`, say("reportMistake", e))}</li>`,
    `<li>${link(`${SITE.repository}/blob/main/CONTRIBUTING.md`, say("contributing", e))}</li>`,
  ];
  const main = [
    `<article class="doc credits"><h1>${words("credits")}</h1>`,
    `<p>${authors}</p>`,
    `<h2>${words("licences")}</h2><ul>${licences.join("")}</ul>`,
    `<h2>${words("howToCredit")}</h2><p>${words("creditIntro")}</p>`,
    `<blockquote><p class="credit-line">${escapeHtml(`${SITE.credit}, ${SITE.url} — ${content.name}`)}</p></blockquote>`,
    `<p>${words("creditChanges")}</p>`,
    `<h2>${words("contribute")}</h2><ul>${contribute.join("")}</ul>`,
    `<p class="muted">${words("nameNote")}</p></article>`,
  ].join("\n");
  ctx.add(
    creditsUrl(e),
    page({
      kind: "credits",
      lang: e,
      title: `${say("credits", e)} — ${site}`,
      description: say("creditsDescription", e, { site }),
      path: creditsUrl(e),
      alternates: alternates(creditsUrl),
      crumbs: [{ label: say("credits", e) }],
      main,
      dev: o.dev,
      siteUrl: o.siteUrl,
    }),
  );
}
