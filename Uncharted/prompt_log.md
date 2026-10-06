# Uncharted — Prompt Log

## Which tool for which job

| Tool | Job |
| --- | --- |
| ChatGPT | Discussed requirements, exploration modes, globe appearance, guide personality, storage, and deployment questions. |
| Codex coding assistant | Generated the standalone HTML/CSS/JavaScript frontend, Python Flask backend, documentation, UI revisions, persistence fix, and six-location reward. |
| Documentation/web lookup | Checked API integration and deployment guidance, including OpenAI structured outputs and Render hosting. |
| Python and pytest | Ran backend checks for validation, clue behavior, service failures, and API response handling. |
| Node.js and Playwright/Chromium | Exercised browser flows and inspected the rendered globe, mobile layout, saved progress, markers, and cloud-toggle behavior. |
| Prettier | Formatted frontend source for readability. |
| OpenAI Responses API (application runtime) | Powers Atlas, the context-aware travel guide; the generated application defaults to gpt-4.1-mini. This is the app's model, not the coding assistant's model. |
| Photon and Open-Meteo (application runtime) | Resolve destinations and supply weather; Open-Meteo also provides a city-search fallback. |

Flask and Three.js are application frameworks rather than AI tools. Render hosts the Python backend; GitHub Pages serves the static frontend. The coding assistant delivered an Uncharted folder without modifying the personal website repository.

## One place AI got it wrong

**Problem:** Discovered places and chat history survived a reload, but clouds covered previously discovered areas again and their markers could not be clicked.

**AI mistake:** The assistant initially interpreted the report as a camera-angle persistence issue. That diagnosis missed the actual loss of geographic discovery state. Prompt 14 explicitly corrected it.

**Cause found:** The saved-place validator returned place data without preserving latitude and longitude. Names remained available to the passport, while the globe lacked valid coordinates for restoring markers and cloud openings.

**Correction:** Preserve coordinates in validated saved places and recover missing coordinates from existing signed place-token metadata where possible. Back up affected saves before recovery. Server-side signature verification remains responsible for validating external requests.

**Verification recorded during implementation:** Browser tests restored six discoveries across repeated reloads, checked cloud openings and marker positions, clicked a restored marker, and exercised damaged-save recovery. The earlier reload check had only verified the passport count, which explains why it missed the visual failure.

This account describes an assistant error and its correction. It does not claim the student independently implemented or tested the fix.

## Actual prompts

### 1. Requirements review

> Heres the project requirements ill be working on today. it will go in my personal website git repository. summarize the project requirements for me

### 2. Initial concept

> could we make an application where its a globe thats covered with clouds completely or darkness or something and the user has to communicate to a chatbot powered by ChatGPT API to keep discovering places around the world. When a new place is discovered, it should show the weather from the weather API and a summary of the area. As the world progresses, the user should be able to look around the globe and click back any places they already discovered. Add some great ideas to this and make sure it fits the requirements properly. Ask me for any questions you have and dont actually build anything yet

### 3. Feature and storage decisions

> there should definitely be a discovery animation and context-aware guide.
>
> 1. the users should have both options just incase they dont know where to start
> 2. I want a semi-lit globe with clouds so the animation is cooler.
> 3. discovering any place in the world is essential
> 4. Yes I already have an API
> 5. Saving on the same browser is enough if we dont need a database requirement or anything more

### 4. Visual style and personality

> 1. It should use realistic earth imagery
> 2. It should be a friendly travel companion mixed with some mystery

### 5. Pre-build clarification

> is there anything else you would like to clarify before building it?

### 6. Repository and delivery preferences

> 1. https://github.com/ShauryaTanwar/Personal-Website
> 2. Yes im happy with that
> 3. I agree with your suggestion
> 4. Faint outlines is good
> 5. No dont leave anything for me besides deploying the site and the API key.
>
> Do you have any other questions

### 7. Standalone delivery

> Thats ok let me worry about the part I have to do after. Don't use my repository or send me that entirely just send me the uncharted part and make sure it is compatible with my github. Lets finalize it one more time. Do you have any final questions?

### 8. Build authorization

> Fully build the application now

### 9. Backend architecture question

> why do i need a render URL if the only APIS I really have are weather and ChatGPT

### 10. Local connection troubleshooting

> it doesnt work.
> http://127.0.0.1:5000/api/health returns {"guide_ready":true,"status":"ok"}
> but Uncharted/index.html does not return any agent nor error codes. the config file has
> // Public configuration only. NEVER put an API key here.
> window.UNCHARTED_CONFIG = {
>   // Set this to your Render URL, without a trailing slash, before deploying.
>   API_BASE_URL: "http://127.0.0.1:5000",
> };

### 11. UI redesign

> Completely rework the UI. The cover that hides the globe is too transparent and doesnt represent clouds at all. It looks too modern. Take inspiration from Google Earth UI and others. Make it look more astronomically themed.

### 12. Continue implementation

> Continue working

### 13. Reload bug report

> When i reload the website the locations I visited and chats are saved but the globe resets. please fix that

### 14. Correction of diagnosis

> No its not the camera angle thats the problem, the clouds cover up the entire globe again and there is nowhere to click for the discovered locations. here is a screenshot of the globe even after discovering 5+ locations. I looked around the whole globe already

### 15. Cloud-removal reward

> add a feature where after 6 locations you can remove the entire cloud cover but only in free explore mode.

### 16. GitHub commit assistance

> help me commit this to github

### 17. Hosting clarification

> I need render to run the python backend?

### 18. Render outage troubleshooting

> the render backend stopped working.
> I didnt change any code and this is the error i keep getting
> Cannot reach the guide. Check your connection; the server may be waking up
> help me troubleshoot render

## Outcome and limits

The resulting application supports a realistic, semi-lit globe with cloud discovery animations, a friendly mystery-themed guide, worldwide place search, destination summaries and weather, saved browser progress, and clickable discovered places. The revised interface uses an astronomical observatory theme. Six distinct discoveries unlock full cloud removal in Free Explore; clue mode restores cloud cover.

The final Render outage prompt is a troubleshooting request, not proof that the outage was resolved. The conversation did not supply the public backend URL or logs needed to establish its cause. No successful live OpenAI call with the user's API key is claimed in this log.

This document records AI assistance and prompts; it does not invent work hours, deployment actions, or independent student contributions.

