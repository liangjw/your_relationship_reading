# v7 production deployment

- Play: https://your-relationship-reading.fliedwolf.workers.dev
- Source: https://github.com/liangjw/your_relationship_reading (master)
- Application source commit: 70f6c187793ddb02e729a474b6b40719851b2ff4
- Cloudflare Worker: your-relationship-reading
- Cloudflare deployment version: 277c9f0e-8ffa-47f6-86d0-47618a936f0d
- Verified: 2026-10-06 23:45 Asia/Shanghai

Cloudflare Workers serves the static dist directory. No application backend, database, account login or AI credential is required for the complete local scoring/report flow. wrangler.jsonc describes the deployment. Publish updates with npm run build followed by npx wrangler deploy under an authorized Cloudflare login.

Release evidence: 22 unit/integration tests; all three v7 experts PASS; both local routes completed; mobile 4 widths × 2 routes and 24 double-tap cases. Production verification compared 15 live files (including all eight manga WebPs) byte-for-byte with dist, completed 30 scenes in a real mobile Edge browser, returned to edit the final answer, generated the public-link report poster, opened the friend link as a fresh visitor, and reloaded the report offline. No browser errors. Reproduce with node scripts/qa-online.mjs; output in artifacts/reviews/online-v7-probe.json.

The report card embeds the public game QR/link. Saving the card and sharing the link works. WeChat SDK menu customization requires a configured signature service and actual WeChat device verification; that optional service is currently disabled. AI prose enhancement is also optional and disabled. Gameplay and the complete final report do not depend on either service.

Artwork was generated with built-in imagegen from the user's galgame style reference. Prompts: artwork/MANGA_V7_PROMPTS.md and MANGA_V7_PROMPTS_B.md. Eight optimized runtime boards are in assets/manga-*-v7.webp; original local PNGs remain in artwork/manga-v7. Boards provide seven setting atmospheres across 30 scenes; exact evidence comes from the readable HTML props and chat, rather than implying sixty separately illustrated cases.
