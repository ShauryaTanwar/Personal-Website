# Verification record

Verified September 18, 2026. This describes actual checks, not a claim of exhaustive testing.

## Automated

`npm test`: **27 tests passed**, zero failures. Coverage includes profile shape and deduplication, artwork URL encoding and artist-image fallback, demo Wikidata artwork resolution, saved flags, rank movement, ten-round comparison correctness, fifty seeded unique crate puzzles, evidence-backed roasts, Track Attack collision/banking/end state, Album Drop clearing/gravity/cascades/top-out, party deductions, one-time reward payout, geographic calculations, the RFC 7636 PKCE vector, invalid callback state, the one-click authorization URL and optional playback scopes, safe HTML/URLs, 204 responses, 401/403, 429/quota limits, malformed JSON, disconnected requests, aborts, bounded server retries, and concurrent token refresh with scope preservation and refresh-token rotation.

`npm run build`: passed with separate lazy-loaded game chunks. The redesigned static index and Demo Mode were opened in the browser; the lobby and all seven game cabinets rendered with no horizontal overflow at the tested desktop width. Demo artwork loaded without broken images.

`npm audit`: zero known vulnerabilities after upgrading Vite from 8.0.13 to 8.3.0. A clean `npm ci` completed successfully against the updated lockfile.

## Interactive browser checks

| Area | Observed result |
| --- | --- |
| Who’s Higher | Completed ten rounds; result reported 8/10 and 2,020 points with earned rewards |
| Roast Machine | Printed six evidence-linked charges; selected a charge and accepted the receipt; result and rewards rendered |
| World Tour | Stamped six artists on six continents, rendered sphere and distance, fetched live Wikidata origins, completed tour |
| Album Drop | Dropped records, paused/resumed, cleared groups, reached top-out after 20 drops with 21 cleared records; result rendered |
| The Aux Cord | Completed twelve selections, guest arrivals/reactions and changing energy; result showed 48% final energy |
| Crate Code | Solved the four slots from visible clues in one check with no scans; result showed 2,400 points and the solution |
| Track Attack | Rendered animated arena and HUD, dash and pause/leave controls worked, idle run reached a loss/result state |
| Passport | All seven completed cabinets and high scores recorded; twelve badges unlocked in the test session; reload retained progress |
| Settings | Earned-coin cosmetic purchase/equip worked; factory theme restored; labeled master slider and mute updated footer |
| Static build | Built assets loaded at a subpath; seven lobby canvases rendered; settings controls worked from built JavaScript |
| Final cabinet UI pass | All seven game modules mounted with their cabinet-specific class and primary play surface; the browser logged no app warnings or errors |
| Globe visual pass | Canvas rendered at its responsive size with atmospheric rim, lit ocean, day/night shading, stars, cloud bands, schematic land and glowing markers |

The saved lobby screenshot shows the synthetic test player's progress. These scores are browser state, not embedded into the shipped demo. No Spotify account data was used in these checks.

## Fixes arising from verification

- Replaced crypto.randomUUID for non-security run identifiers on insecure preview origins. PKCE retains secure randomness and secure-context requirements.
- Prevented stale profile reuse across a new account login.
- Preserved optional refresh-response scopes and deduplicated simultaneous refreshes.
- Fixed next-record preview timing after a drop.
- Canceled World Tour callbacks after a run ends.
- Handled failed SDK connection promises without an orphaned ready rejection.
- Connected master/mute controls to SDK volume as well as arcade audio.
- Added explicit accessible slider labels and kept the skip link from changing a game route.

## Remaining live-environment checks

Actual Spotify login, callback exchange, API allowlist access, real-account profile normalization, and Premium SDK playback require an owner-configured Client ID and authorized account. Visitors now go directly from the Connect Spotify button to Spotify; they are never asked for a developer identifier. The authenticated paths were **not** tested against a real Spotify account. The token regression uses mocked responses. Playback audio quality was not audibly assessed through the remote browser.

GitHub Actions deployment has not run against a repository because no repository target was supplied. After deployment, verify the exact HTTPS callback, allowlisted and denied accounts, revoked tokens, SDK device creation and audio permissions. The project targets modern desktop browsers; a comprehensive mobile, cross-browser, or assistive-technology audit was not performed. Canvas games are not fully screen-reader equivalent.

Optional WebMCP state/navigation tools feature-detect document.modelContext. The browser reported modelContext unavailable, so supported-context registration/execution validation was unavailable. This optional feature does not gate gameplay.
