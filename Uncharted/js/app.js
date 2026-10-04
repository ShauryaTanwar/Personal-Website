import { World } from "./globe.js";
import { load, save, validate, defaults } from "./store.js";
const $ = (id) => document.getElementById(id);
let state = await load(),
  world = null,
  busy = false,
  selected = null,
  detailsSerial = 0,
  noticeTimer,
  unsavedWarned = false;
const config = window.UNCHARTED_CONFIG || {};
const local = ["localhost", "127.0.0.1"].includes(location.hostname);
const API = (
  config.API_BASE_URL || (local ? "http://127.0.0.1:5000" : "")
).replace(/\/$/, "");
function node(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function notice(text) {
  $("notice").textContent = text;
  $("notice").hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($("notice").hidden = true), 6000);
}
function persist() {
  if (!save(state) && !unsavedWarned) {
    notice(
      "Browser storage is full or disabled. Export your journey to preserve it.",
    );
    unsavedWarned = true;
  }
}
async function api(path, data) {
  if (!API)
    throw new Error(
      "The backend URL has not been configured yet. Set API_BASE_URL in config.js after deploying the backend.",
    );
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const res = await fetch(API + path, {
      method: data ? "POST" : "GET",
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    const result = await res.json();
    if (!res.ok) {
      const e = new Error(
        result.error || "The service could not complete this request.",
      );
      e.status = res.status;
      throw e;
    }
    return result;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error(
        "That took too long. The server may be waking up; please try again.",
      );
    if (e instanceof TypeError)
      throw new Error(
        "Cannot reach the guide. Check your connection; the server may be waking up.",
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
function message(role, text, remember = true, extra = "") {
  const wrap = node("div", undefined, `message ${role} ${extra}`);
  wrap.append(
    node(
      "div",
      role === "user" ? "YOU" : "ATLAS · YOUR TRAVEL COMPANION",
      "message-label",
    ),
    node("p", text),
  );
  $("messages").append(wrap);
  $("messages").scrollTop = $("messages").scrollHeight;
  if (remember) {
    state.history.push({ role, text });
    state.history = state.history.slice(-30);
    persist();
  }
  return wrap;
}
function renderHistory() {
  $("messages").replaceChildren();
  if (!state.history.length)
    message(
      "assistant",
      "Somewhere out there is a place you haven’t imagined yet. I’m Atlas—tell me what draws you in, name a place, or follow a clue. Let’s see where we end up.",
      false,
    );
  else state.history.forEach((h) => message(h.role, h.text, false));
}
function setBusy(value) {
  busy = value;
  document
    .querySelectorAll(
      "#chat-form button,#search-form button,#clue-actions button,#suggestions button,.mode-switch button,.choice",
    )
    .forEach((b) => (b.disabled = value));
  $("message-input").disabled = value;
}
function mode(value) {
  state.mode = value;
  state.riddle = null;
  persist();
  updateMode();
  $("choices").replaceChildren();
  if (value === "clue")
    message(
      "assistant",
      "A little mystery, then. Tell me a theme—or press “Start a mystery.” I’ll leave you a trail of clues.",
    );
  else
    message(
      "assistant",
      "The world is yours. Name a place to discover it, or tell me what kind of destination you’re looking for.",
    );
}
function updateMode() {
  updateCloudControl();
  $("explore-mode").setAttribute("aria-pressed", state.mode === "explore");
  $("clue-mode").setAttribute("aria-pressed", state.mode === "clue");
  $("clue-actions").hidden = !state.riddle || state.mode !== "clue";
  $("message-input").placeholder =
    state.riddle && state.mode === "clue"
      ? "What place could it be?"
      : state.mode === "clue"
        ? "Choose a theme for your mystery…"
        : "Where does your curiosity lead?";
  const suggestions =
    state.mode === "clue"
      ? [
          ["Start a mystery", "Give me a new mystery destination"],
          ["A nature mystery", "Give me a mystery about a natural wonder"],
          ["A historic city", "Give me a mystery about a historic city"],
        ]
      : [
          ["Surprise me ↗", "Take me somewhere unexpected"],
          ["Ancient cities", "I want to explore ancient cities"],
          ["Mountains & quiet", "Find a place surrounded by mountains"],
        ];
  $("suggestions").replaceChildren();
  for (const [label, prompt] of suggestions) {
    const b = node("button", label);
    b.onclick = () => {
      if (state.mode === "clue") state.riddle = null;
      send(prompt);
    };
    $("suggestions").append(b);
  }
}
function choices(places) {
  $("choices").replaceChildren();
  if (!places?.length) return;
  const caption = node(
    "p",
    places.length > 1 ? "Choose the place you mean:" : "Your next discovery:",
    "eyebrow",
  );
  $("choices").append(caption);
  for (const p of places) {
    const b = node("button", undefined, "choice");
    b.append(
      node("strong", p.name),
      node("span", [p.region, p.country].filter(Boolean).join(" · ")),
    );
    b.onclick = () => discover(p);
    $("choices").append(b);
  }
}
async function send(text) {
  if (busy || !text.trim()) return;
  const history = state.history.slice(-12);
  message("user", text);
  $("message-input").value = "";
  $("message-input").style.height = "";
  setBusy(true);
  $("choices").replaceChildren();
  const pending = message(
    "assistant",
    state.riddle ? "Following the clues…" : "Looking beyond the horizon…",
    false,
    "pending",
  );
  try {
    if (state.mode === "clue" && state.riddle) {
      await clueRequest("guess", text);
    } else {
      const result = await api("/api/chat", {
        message: text,
        mode: state.mode,
        history,
        discoveries: state.places.map((p) => p.label),
      });
      message("assistant", result.reply);
      choices(result.places);
      if (result.riddle) {
        state.riddle = result.riddle;
        persist();
        updateMode();
      }
    }
  } catch (e) {
    message("assistant", e.message, false, "error");
    if (e.status === 410) {
      state.riddle = null;
      persist();
      updateMode();
    }
  } finally {
    pending.remove();
    setBusy(false);
  }
}
async function clueRequest(action, guess = "") {
  const result = await api("/api/clue", {
    riddle: state.riddle,
    action,
    guess,
  });
  message("assistant", result.reply);
  if (result.solved) {
    state.riddle = null;
    persist();
    updateMode();
    await discover(result.place);
  }
}
async function clueAction(action) {
  if (busy) return;
  setBusy(true);
  try {
    await clueRequest(action);
  } catch (e) {
    message("assistant", e.message, false, "error");
    if (e.status === 410) {
      state.riddle = null;
      persist();
      updateMode();
    }
  } finally {
    setBusy(false);
  }
}
async function search(event) {
  event.preventDefault();
  if (busy) return;
  const query = $("search-input").value.trim();
  if (query.length < 2) return;
  setBusy(true);
  try {
    const result = await api("/api/search", { query });
    choices(result.places);
    message(
      "assistant",
      result.places.length
        ? "I found these matches. Pick your destination below."
        : "No reliable match yet. Try another spelling or add the country.",
    );
  } catch (e) {
    message("assistant", e.message, false, "error");
  } finally {
    setBusy(false);
  }
}
async function discover(p) {
  $("choices").replaceChildren();
  const existing = state.places.find((x) => x.id === p.id);
  const isNew = !existing;
  const place = existing
    ? Object.assign(existing, p)
    : { ...p, discoveredAt: new Date().toISOString() };
  if (isNew) state.places.push(place);
  if (isNew && state.places.length === 6)
    notice("Six discoveries! You can now show the full Earth in Free Explore.");
  persist();
  updateCounts();
  world?.setPlaces(state.places);
  if (isNew) {
    world?.paintMask(place, 0);
    $("discovery-toast").querySelector("strong").textContent = place.name;
    $("discovery-toast").classList.add("active");
  }
  const flight = world?.discover(place, isNew) || Promise.resolve();
  const detailPromise = fetchDetails(place);
  await flight;
  $("discovery-toast").classList.remove("active");
  await openPlace(place, detailPromise);
}
async function fetchDetails(place) {
  try {
    return await api("/api/place", { token: place.token });
  } catch (e) {
    return { error: e.message };
  }
}
async function openPlace(place, promise = null) {
  selected = place;
  const serial = ++detailsSerial;
  $("place-name").textContent = place.name;
  $("place-region").textContent = [place.region, place.country]
    .filter(Boolean)
    .join(" · ");
  $("place-coordinates").textContent =
    `${Math.abs(place.lat).toFixed(3)}° ${place.lat >= 0 ? "N" : "S"} / ${Math.abs(place.lon).toFixed(3)}° ${place.lon >= 0 ? "E" : "W"}`;
  $("place-date").textContent =
    "Discovered " +
    new Date(place.discoveredAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  $("map-link").href =
    `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=10/${place.lat}/${place.lon}`;
  $("weather").textContent = "Checking the skies…";
  $("place-summary").textContent =
    place.overview?.summary || "Getting to know this corner of the world…";
  $("place-highlights").replaceChildren();
  $("summary-note").textContent = "";
  $("place-dialog").showModal();
  const result = await (promise || fetchDetails(place));
  if (serial !== detailsSerial) return;
  if (result.error) {
    renderPlaceDetails(place, result.error);
    return;
  }
  place.weather = result.weather || null;
  place.weatherError = result.weather_error;
  place.overview = result.overview || place.overview || null;
  place.overviewError = result.overview_error;
  if (result.place?.token) place.token = result.place.token;
  persist();
  renderPlaceDetails(place);
}
function weatherLabel(code) {
  if (code === 0) return ["☀", "Clear skies"];
  if (code <= 3) return ["☁", "Partly cloudy"];
  if (code <= 48) return ["≋", "Foggy"];
  if (code <= 57) return ["☂", "Drizzle"];
  if (code <= 67) return ["☂", "Rain"];
  if (code <= 77) return ["❄", "Snow"];
  if (code <= 82) return ["☂", "Rain showers"];
  if (code <= 86) return ["❄", "Snow showers"];
  return ["ϟ", "Thunderstorms"];
}
function temp(c) {
  return `${Math.round(state.unit === "f" ? (c * 9) / 5 + 32 : c)}°${state.unit.toUpperCase()}`;
}
function renderPlaceDetails(p, error = null) {
  const w = $("weather");
  w.replaceChildren();
  if (p.weather?.current) {
    const c = p.weather.current,
      [icon, label] = weatherLabel(c.weather_code),
      row = node("div", undefined, "weather-main");
    row.append(
      node("span", icon, "weather-icon"),
      node("span", temp(c.temperature_2m), "temperature"),
      node("span", label, "weather-condition"),
    );
    w.append(row);
    const details = node("div", undefined, "weather-details");
    details.append(
      node("span", `Feels like ${temp(c.apparent_temperature)}`),
      node(
        "span",
        `Wind ${Math.round(state.unit === "f" ? c.wind_speed_10m * 0.621371 : c.wind_speed_10m)} ${state.unit === "f" ? "mph" : "km/h"}`,
      ),
      node("span", `Humidity ${c.relative_humidity_2m}%`),
    );
    w.append(details);
    w.append(
      node(
        "div",
        `${error ? "Saved weather · " : ""}${c.time.replace("T", " ")} · ${p.weather.timezone} · Open-Meteo`,
        "weather-source",
      ),
    );
  } else
    w.append(
      node(
        "p",
        p.weatherError ||
          error ||
          "Weather is unavailable right now. Your discovery is saved.",
        "muted",
      ),
    );
  $("place-summary").textContent =
    p.overview?.summary ||
    p.overviewError ||
    error ||
    `Explore ${p.label}. An area overview is temporarily unavailable.`;
  $("place-highlights").replaceChildren(
    ...(p.overview?.highlights || []).map((x) => node("li", x)),
  );
  $("summary-note").textContent = p.overview
    ? "AI-generated overview · Details may be imperfect. Explore the source map to learn more."
    : "";
  if (error) notice(error);
}
function updateCounts() {
  updateCloudControl();
  $("passport-count").textContent = state.places.length;
  $("world-count").textContent = state.places.length
    ? `${state.places.length} ${state.places.length === 1 ? "PLACE" : "PLACES"} DISCOVERED`
    : "YOUR JOURNEY STARTS HERE";
}
function renderPassport() {
  const filter = $("passport-filter").value.toLowerCase();
  const places = state.places
    .filter((p) => p.label.toLowerCase().includes(filter))
    .slice()
    .reverse();
  const countries = new Set(state.places.map((p) => p.country).filter(Boolean));
  $("passport-summary").textContent =
    `${state.places.length} discoveries · ${countries.size} countries · A story that’s still unfolding.`;
  $("passport-list").replaceChildren();
  if (!places.length) {
    $("passport-list").append(
      node(
        "p",
        state.places.length
          ? "No matching discoveries."
          : "Your first stamp is waiting. Ask Atlas where to begin.",
        "empty-passport",
      ),
    );
    return;
  }
  for (const p of places) {
    const b = node("button", undefined, "passport-entry");
    b.append(
      node(
        "span",
        "✧ DISCOVERED " +
          new Date(p.discoveredAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        "stamp",
      ),
      node("strong", p.name),
      node("small", p.country || p.region),
    );
    b.onclick = () => {
      $("passport-dialog").close();
      world?.flyTo(p);
      openPlace(p);
    };
    $("passport-list").append(b);
  }
}
$("chat-form").onsubmit = (e) => {
  e.preventDefault();
  send($("message-input").value);
};
$("message-input").onkeydown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("chat-form").requestSubmit();
  }
};
$("message-input").oninput = (e) => {
  e.target.style.height = "auto";
  e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
};
$("search-form").onsubmit = search;
$("search-toggle").onclick = () => {
  $("search-form").hidden = !$("search-form").hidden;
  if (!$("search-form").hidden) $("search-input").focus();
};
$("explore-mode").onclick = () => {
  if (state.mode !== "explore") mode("explore");
};
$("clue-mode").onclick = () => {
  if (state.mode !== "clue") mode("clue");
};
$("hint-button").onclick = () => clueAction("hint");
$("reveal-button").onclick = () => clueAction("reveal");
$("new-clue-button").onclick = () => {
  state.riddle = null;
  persist();
  updateMode();
  send("Give me a new mystery destination");
};
$("passport-button").onclick = () => {
  renderPassport();
  $("passport-dialog").showModal();
};
$("passport-filter").oninput = renderPassport;
$("settings-button").onclick = () => $("settings-dialog").showModal();
$("about-button").onclick = () => $("about-dialog").showModal();
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("place-dialog").addEventListener("close", () => detailsSerial++);
$("unit-select").value = state.unit;
$("motion-toggle").checked = state.reduced;
$("unit-select").onchange = (e) => {
  state.unit = e.target.value;
  persist();
};
$("motion-toggle").onchange = (e) => {
  state.reduced = e.target.checked;
  world?.setMotion(state.reduced);
  persist();
};
$("unit-button").onclick = () => {
  state.unit = state.unit === "c" ? "f" : "c";
  $("unit-select").value = state.unit;
  persist();
  if (selected) renderPlaceDetails(selected);
};
$("retry-place").onclick = () => {
  if (selected) openPlace(selected);
};
$("nearby-button").onclick = () => {
  const p = selected;
  $("place-dialog").close();
  state.mode = "explore";
  state.riddle = null;
  persist();
  updateMode();
  send(
    `I just explored ${p.label}. Suggest another place I might love, and explain the connection.`,
  );
};
function updateCloudControl() {
  const unlocked = state.places.length >= 6;
  const freeExplore = state.mode === "explore";
  const active = unlocked && freeExplore && state.fullEarth;
  const button = $("full-earth-toggle");
  button.disabled = !unlocked || !freeExplore;
  button.setAttribute("aria-pressed", String(active));
  button.textContent = !freeExplore
    ? "Clouds on · Clue mode"
    : !unlocked
      ? `Full Earth · ${state.places.length}/6`
      : active
        ? "Restore cloud cover"
        : "Show full Earth";
  button.title = !freeExplore
    ? "Full Earth is only available in Free Explore."
    : !unlocked
      ? "Discover six different locations to unlock this view."
      : active
        ? "Return to your discovered areas."
        : "Temporarily remove all clouds. This does not discover new places.";
  world?.setFullEarth(active);
}
$("full-earth-toggle").onclick = () => {
  if (state.mode !== "explore" || state.places.length < 6) return;
  state.fullEarth = !state.fullEarth;
  persist();
  updateCloudControl();
};
$("zoom-in").onclick = () => world?.zoom(0.86);
$("zoom-out").onclick = () => world?.zoom(1.16);
$("home-view").onclick = () => world?.home();
$("rotation-button").onclick = () => {
  const paused = world?.toggleRotation();
  $("rotation-button").textContent = paused ? "▷" : "Ⅱ";
  $("rotation-button").setAttribute("aria-pressed", String(!!paused));
  $("rotation-button").setAttribute(
    "aria-label",
    paused ? "Resume globe rotation" : "Pause globe rotation",
  );
};
$("reset-button").onclick = () => {
  if (
    !confirm(
      "Reset your discoveries and conversation on this browser? Export your passport first if you want a backup.",
    )
  )
    return;
  state = defaults();
  persist();
  world?.setPlaces([]);
  world?.setMotion(state.reduced);
  $("unit-select").value = state.unit;
  $("motion-toggle").checked = state.reduced;
  $("settings-dialog").close();
  updateCounts();
  updateMode();
  renderHistory();
  $("choices").replaceChildren();
  notice("A fresh horizon. Your new journey starts here.");
};
$("export-button").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
  );
  const a = node("a");
  a.href = url;
  a.download = "uncharted-journey.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("import-button").onclick = () => $("import-file").click();
$("import-file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5_000_000)
      throw new Error("Choose a journey file smaller than 5 MB.");
    const imported = validate(JSON.parse(await file.text()));
    const merged = new Map(state.places.map((p) => [p.id, p]));
    imported.places.forEach((p) => {
      if (!merged.has(p.id)) merged.set(p.id, p);
    });
    state.places = [...merged.values()];
    persist();
    world?.setPlaces(state.places);
    updateCounts();
    renderPassport();
    notice("Your discoveries have been added to this passport.");
  } catch (err) {
    notice(err.message || "Could not read that journey file.");
  }
  e.target.value = "";
};
renderHistory();
updateMode();
updateCounts();
try {
  world = new World(
    $("globe"),
    (p) => openPlace(state.places.find((x) => x.id === p.id) || p),
    () => {
      $("globe-loading").hidden = true;
    },
    (e) => {
      $("globe-loading").textContent =
        e.message || "Earth imagery could not load. Reload to try again.";
    },
  );
  world.setPlaces(state.places);
  world.setMotion(state.reduced);
  updateCloudControl();
} catch (e) {
  $("globe-loading").textContent =
    "3D graphics are unavailable in this browser. You can still explore with Atlas and your passport.";
}
api("/api/health")
  .then((data) => {
    $("connection").textContent = data.guide_ready
      ? "Atlas is ready. Where shall we go?"
      : "Place search is ready. Atlas needs the backend API key.";
    $("connection").className =
      "connection " + (data.guide_ready ? "ready" : "warning");
  })
  .catch((e) => {
    $("connection").textContent = e.message;
    $("connection").className = "connection warning";
  });
