const KEY = "uncharted.journey.v1";
export function cleanPlace(p) {
  if (
    !p ||
    typeof p.id !== "string" ||
    typeof p.name !== "string" ||
    !Number.isFinite(p.lat) ||
    !Number.isFinite(p.lon) ||
    Math.abs(p.lat) > 90 ||
    Math.abs(p.lon) > 180 ||
    typeof p.token !== "string"
  )
    return null;
  const summary =
    p.overview && typeof p.overview.summary === "string"
      ? {
          summary: p.overview.summary.slice(0, 1800),
          highlights: Array.isArray(p.overview.highlights)
            ? p.overview.highlights
                .filter((x) => typeof x === "string")
                .slice(0, 3)
                .map((x) => x.slice(0, 180))
            : [],
          ai_generated: true,
        }
      : null;
  const current = p.weather?.current;
  const validWeather =
    current &&
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
    ].every((k) => Number.isFinite(current[k])) &&
    typeof current.time === "string";
  return {
    overview: summary,
    weather: validWeather ? p.weather : null,
    id: p.id.slice(0, 100),
    lat: p.lat,
    lon: p.lon,
    kind: typeof p.kind === "string" ? p.kind.slice(0, 80) : "place",
    name: p.name.slice(0, 200),
    country: String(p.country || "").slice(0, 160),
    region: String(p.region || "").slice(0, 160),
    label: String(p.label || p.name).slice(0, 500),
    token: p.token.slice(0, 4000),
    discoveredAt:
      typeof p.discoveredAt === "string" &&
      Number.isFinite(Date.parse(p.discoveredAt))
        ? p.discoveredAt
        : new Date().toISOString(),
  };
}
export function defaults() {
  return {
    version: 1,
    places: [],
    history: [],
    mode: "explore",
    unit: "c",
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    riddle: null,
    fullEarth: false,
  };
}
export function validate(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.places))
    throw new Error("This is not an Uncharted journey file.");
  const unique = new Map();
  data.places
    .slice(0, 3000)
    .map(cleanPlace)
    .filter(Boolean)
    .forEach((p) => unique.set(p.id, p));
  const d = defaults();
  return {
    ...d,
    places: [...unique.values()],
    history: (Array.isArray(data.history) ? data.history : [])
      .filter(
        (h) =>
          h &&
          ["user", "assistant"].includes(h.role) &&
          typeof h.text === "string",
      )
      .slice(-30)
      .map((h) => ({ role: h.role, text: h.text.slice(0, 2500) })),
    mode: data.mode === "clue" ? "clue" : "explore",
    fullEarth: data.fullEarth === true,
    unit: data.unit === "f" ? "f" : "c",
    reduced: typeof data.reduced === "boolean" ? data.reduced : d.reduced,
    riddle: typeof data.riddle === "string" ? data.riddle.slice(0, 100) : null,
  };
}
function hasCoordinates(p) {
  return (
    p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lon) <= 180
  );
}

// Old builds accidentally removed lat/lon when cleaning stored discoveries.
// Their signed tokens still contain public location metadata. Decode ONLY for
// local display recovery; /api/place still verifies the signature server-side.
async function recoverCoordinates(p) {
  if (hasCoordinates(p) || typeof p?.token !== "string") return p;
  try {
    const compressed = p.token.startsWith(".");
    const payload = p.token.split(".")[compressed ? 1 : 0];
    if (!payload || payload.length > 6000) return p;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
      (c) => c.charCodeAt(0),
    );
    let decoded;
    if (compressed) {
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate"));
      const reader = stream.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16000) {
          await reader.cancel();
          return p;
        }
        chunks.push(value);
      }
      decoded = JSON.parse(await new Blob(chunks).text());
    } else decoded = JSON.parse(new TextDecoder().decode(bytes));
    if (decoded.id === p.id && hasCoordinates(decoded))
      return {
        ...p,
        lat: decoded.lat,
        lon: decoded.lon,
        kind: decoded.kind || "place",
      };
  } catch {
    /* Keep the original backup if a token is not recoverable. */
  }
  return p;
}

export async function load() {
  try {
    const value = localStorage.getItem(KEY);
    if (!value) return defaults();
    const raw = JSON.parse(value);
    if (
      Array.isArray(raw.places) &&
      raw.places.some((p) => !hasCoordinates(p))
    ) {
      // Never overwrite the only copy of a damaged save during migration.
      try {
        if (!localStorage.getItem(KEY + ".recovery-backup"))
          localStorage.setItem(KEY + ".recovery-backup", value);
      } catch {}
      raw.places = await Promise.all(
        raw.places.slice(0, 3000).map(recoverCoordinates),
      );
    }
    const restored = validate(raw);
    save(restored);
    return restored;
  } catch {
    return defaults();
  }
}
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
