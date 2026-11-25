# Plan: Serve the hub at skills.oharu121.com

**Status:** Completed
**Date:** 2026-11-25

## Context

The hub has been served from the Vercel-assigned host `oharu-skill-hub.vercel.app` since its first release. The owner's blog already lives at `oharu121.com` on the same Vercel team, and the hub belongs beside it rather than on a generated hostname that says nothing about whose site it is. A subdomain was chosen over a path under the blog because the hub is a separate Starlight site, built and deployed from its own repository, and a path would have required the blog to proxy or rewrite into a second project.

The DNS and Vercel side was done by the owner before this change: `skills.oharu121.com` was added as a domain on the `oharu-skill-hub` Vercel project, and a CNAME for `skills` was added at Cloudflare, which hosts the `oharu121.com` zone. The host answered `HTTP/2 200` before any code changed. What remained was the repository still describing itself as living at the old host.

## Approach

Astro's `site` option is the single source of the site's origin. Starlight derives the canonical link, the sitemap and Open Graph URLs from it, so changing that one value moves every generated absolute URL at once, with no per-page edits. The remaining references to the old host are hand-written: the README's links, and the `release` skill's **Site** setting and the post-deploy `curl` check that reads it. Those were updated by hand.

The `site` change was deliberately made only after the new host was confirmed live. Changing it first would have published canonical links to a host that did not resolve yet.

The old host keeps working, since Vercel serves a project on its `.vercel.app` domain alongside any custom domain. Redirecting it to the new host is a Vercel dashboard setting, not a repository change, and is left to the owner.

## Changes

1. **`astro.config.mjs`** — `site` changed from `https://oharu-skill-hub.vercel.app` to `https://skills.oharu121.com`. The built `index.html` now carries `rel="canonical" href="https://skills.oharu121.com/"`.
2. **`README.md`** — the **Site** line and the Skills, Gems and Getting started links point at the new host.
3. **`.claude/skills/release/SKILL.md`** — the **Site** row in Fixed Settings and the Step 14.5 `curl` check use `https://skills.oharu121.com`, so the release flow confirms the production deploy against the host readers actually use.

`.plans/initial-public-release-bilingual-skill-hub.md` still names the old host. It records what the first release did and is left as written.

## Files Modified

| File | Change |
| ---- | ------ |
| [astro.config.mjs](https://github.com/oharu121/oharu-skill-hub/blob/main/astro.config.mjs) | `site` set to `https://skills.oharu121.com` |
| [README.md](https://github.com/oharu121/oharu-skill-hub/blob/main/README.md) | Site and section links moved to the new host |
| [.claude/skills/release/SKILL.md](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/SKILL.md) | **Site** setting and Step 14.5 health check moved to the new host |
| [CHANGELOG.md](https://github.com/oharu121/oharu-skill-hub/blob/main/CHANGELOG.md) | v0.2.2 entry |

## Guard Rails

| Scenario | Behavior |
| -------- | -------- |
| A bookmark or external link uses `oharu-skill-hub.vercel.app` | Still served by Vercel; it does not redirect unless the owner adds a redirect in the Vercel dashboard |
| The Cloudflare CNAME is proxied (orange cloud) | Vercel's certificate issuance can fail; the record should stay DNS only |
| A future release's Step 14.5 check | Curls `https://skills.oharu121.com/`, so a broken custom domain is reported even when the `.vercel.app` host is fine |

## Verification

1. `curl -sI https://skills.oharu121.com/` returns `HTTP/2 200`.
2. `pnpm build`, then `grep -o 'rel="canonical" href="[^"]*"' dist/index.html` prints `https://skills.oharu121.com/`.
3. `grep -rn "oharu-skill-hub.vercel.app" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro .` matches only `.plans/initial-public-release-bilingual-skill-hub.md`.

## Breaking Changes

None. The old host keeps serving the same site.
