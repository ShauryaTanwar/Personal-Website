# Uncharted prompt log

## Provenance and scope

This log was assembled by the coding assistant from the visible planning/build conversation. User prompts below are quoted verbatim as text (attachment metadata and HTML nonbreaking-space encodings are omitted). Implementation notes are explicitly AI-written summaries, not reconstructed user prompts.

Tools/models used:

- ChatGPT for the planning conversation; the exact earlier model identifier was not exposed in the conversation.
- Codex, a GPT-6-based coding assistant, for this implementation. No sub-agents were used.
- Official documentation lookup for the OpenAI Responses API/structured outputs, map services, and Render deployment.
- Python, Flask, requests, pytest, Node.js, Playwright/Chromium, and Prettier for implementation and validation.
- The finished application defaults to `gpt-4.1-mini` through the OpenAI Responses API; this is the runtime model configured in the application, not a claim about the coding assistant's exact model.

The coding assistant generated the application code, automated tests, and reference documentation. No student code changes, deployment, final video, or personal work-hours are claimed here. Add your actual later work and important prompts as you continue. Do not stretch this record to imply eight hours of work that did not occur.

## Important user prompts, in order

### 1. Requirements review

> Heres the project requirements ill be working on today. it will go in my personal website git repository. summarize the project requirements for me

The assignment was supplied as `Pasted markdown(3).md`. It was read to identify functional, technical, documentation, learning, and submission requirements.

### 2. Initial concept

> could we make an application where its a globe thats covered with clouds completely or darkness or something and the user has to communicate to a chatbot powered by ChatGPT API to keep discovering places around the world. When a new place is discovered, it should show the weather from the weather API and a summary of the area. As the world progresses, the user should be able to look around the globe and click back any places they already discovered. Add some great ideas to this and make sure it fits the requirements properly. Ask me for any questions you have and dont actually build anything yet

### 3. Scope decisions

> there should definitely be a discovery animation and context-aware guide.
>
> 1. the users should have both options just incase they dont know where to start
> 2. I want a semi-lit globe with clouds so the animation is cooler.
> 3. discovering any place in the world is essential
> 4. Yes I already have an API
> 5. Saving on the same browser is enough if we dont need a database requirement or anything more

### 4. Visual and guide personality

> 1. It should use realistic earth imagery
> 2. It should be a friendly travel companion mixed with some mystery

### 5. Clarification request

> is there anything else you would like to clarify before building it?

### 6. Repository and delivery preferences

> 1. https://github.com/ShauryaTanwar/Personal-Website
> 2. Yes im happy with that
> 3. I agree with your suggestion
> 4. Faint outlines is good
> 5. No dont leave anything for me besides deploying the site and the API key.
>
> Do you have any other questions

The agreed hosting was an existing GitHub Pages frontend with a Flask backend on Render. Free exploration can unlock a named destination; clue mode requires a correct guess or explicit reveal. Ambiguous map results require choosing the intended location.

### 7. Separate project package

> Thats ok let me worry about the part I have to do after. Don't use my repository or send me that entirely just send me the uncharted part and make sure it is compatible with my github. Lets finalize it one more time. Do you have any final questions?

### 8. Build authorization

> Fully build the application now

## AI-written implementation record

1. Created a standalone `Uncharted/` folder without reading, cloning, or modifying the personal website repository.
2. Built a no-build static frontend with bundled Three.js, OrbitControls, and realistic Earth/cloud images. Relative paths support a GitHub Pages project subdirectory.
3. Implemented a geographic canvas reveal mask, animated cloud drift, atmospheric glow, camera flight, clickable markers, and reduced-motion controls.
4. Implemented the Atlas conversation panel, free exploration, clue mode, place-choice disambiguation, destination dialogs, weather units, passport filtering, JSON export/import, and validated local browser storage.
5. Built Flask endpoints for health, chat, search, clues, and destination details. OpenAI returns strict JSON action fields. Photon supplies verified coordinates; Open-Meteo supplies weather and a city-search fallback.
6. Kept clue answers behind server-side random IDs. Signed place tokens prevent the client from turning a model-generated location into an unverified details request. API keys stay in environment variables.
7. Added bounded caches, request limits, a model-call allowance, readable failure messages, and independent handling of weather/overview outages.
8. Ran automated backend tests and fixture-backed browser flows. Checked rendered desktop/mobile screenshots and exercised real map/weather calls.
9. Formatted the frontend source for readability and wrote deployment/API/asset documentation, explicitly labeled as AI-generated.
10. Packaged only the Uncharted project folder for delivery; did not deploy or set any user credentials.

## One place AI got it wrong

The first cloud shader sampled the texture's red channel as cloud density. Inspection of the actual PNG showed that much of its RGB data is white while cloud density is carried in the alpha channel, so the first render appeared too uniform. The assistant inspected pixel values and a browser screenshot, then changed density to `cloud.r * cloud.a`, adjusted lighting, and rendered it again. This was an assistant-discovered and assistant-fixed bug; it is not represented as a student debugging contribution.

A second correctness fix came from reviewing clue normalization: stripping everything except ASCII letters/numbers could turn different non-Latin answers into the same empty string. The implementation now preserves Unicode letters/numbers, rejects an empty normalized guess, and tests distinct Japanese names.

## Validation and limits

- 12 backend tests: input/origin validation, missing keys, signed candidates, hidden clue targets, hints/guesses/reveal/expiry, free-explore ambiguity, independent service failures, rate limits, model-call budget and response parsing, geocoder cache/fallback, Unicode guesses.
- Browser suite: real WebGL globe and animations with fixture-backed APIs; destination cards; units; passport/reload; clue flow; context propagation; duplicate prevention; API error recovery; ambiguous choices; phone-width overflow.
- Live checks: map queries for real worldwide places and an Open-Meteo weather response.
- No live OpenAI request was made with the user's key. Account access, credits, and chosen model must be checked after deployment.
- Public map-service availability and dataset coverage limit obscure-place discovery. There is no artificial fixed list of destinations.
- Work duration and student-made code modifications remain unrecorded until the student supplies their actual work.

## Continuing this log

For each later session, append the date, tool/model, your exact important prompt, the outcome, and the specific changes you made yourself. Keep this file separate from the README.

## UI revision — October 4, 2026

User prompt (verbatim):

> Completely rework the UI. The cover that hides the globe is too transparent and doesnt represent clouds at all. It looks too modern. Take inspiration from Google Earth UI and others. Make it look more astronomically themed.

AI-written revision record: Replaced the split dashboard with a full-screen observatory, a compact map-tool rail, collapsible guide, separate search panel, serif typography, brass details, decorative stars and a compass ring. Rebuilt the cloud shader as a nearly opaque deck shaded with satellite texture and procedural billows; cloud opacity now depends on the discovery mask rather than low cloud density. Added irregular reveal edges and corrected camera field-of-view for narrow phone viewports. Added a direct-file launch notice, and UPDATE.md explains how to install only the changed frontend files while preserving the user's config.js and .env. Browser regression tests exercised the existing game flows and new panel controls. No API key or repository access was used.


## Saved-globe bug fix — October 4, 2026

User prompt (verbatim):

> When i reload the website the locations I visited and chats are saved but the globe resets. please fix that

User correction (verbatim):

> No its not the camera angle thats the problem, the clouds cover up the entire globe again and there is nowhere to click for the discovered locations. here is a screenshot of the globe even after discovering 5+ locations. I looked around the whole globe already

AI-written debugging record: The assistant first misdiagnosed the symptom as an unsaved camera angle. The user corrected that diagnosis. Inspecting the complete saved-place validator showed that its returned object omitted lat/lon, so saved names survived while the globe received undefined coordinates. Fixed the validator to preserve coordinates and added local recovery from the public metadata in existing signed location tokens, including zlib-compressed tokens. Raw affected saves are backed up before migration. The backend still verifies signatures for external requests. No camera behavior change was made for this fix.

The original browser test only checked the passport count after reloading; it did not verify the restored coordinates or cloud mask. A new test seeds six discoveries, reloads three times, verifies all six cloud-mask openings and finite marker positions, clicks a restored marker, and repeats with damaged saves. Both ordinary and recovery scenarios passed. This is a documented assistant error and correction, not a student contribution.


## Six-location cloud reward — October 4, 2026

User prompt (verbatim):

> add a feature where after 6 locations you can remove the entire cloud cover but only in free explore mode.

AI-written implementation record: Added a Cloud layer toggle with discovery-count progress. Six distinct saved places unlock full-Earth viewing in Free Explore. The renderer hides only the cloud mesh, preserving the geographic reveal mask and markers. Clue mode forces the mesh back on and disables the toggle. The user's Free Explore preference survives reloads; resetting a journey clears it. Extended the browser regression test to exercise five-place gating, live unlocking at six, on/off behavior, persistence, clue-mode enforcement after reload, returning to Free Explore, and reset behavior. No backend or API-key changes were made.
