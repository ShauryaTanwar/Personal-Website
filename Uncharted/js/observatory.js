// Observatory-only controls. The exploration/API logic remains in app.js.
import "./app.js";
const $ = (id) => document.getElementById(id);
function showGuide(show) {
  document.body.classList.toggle("guide-hidden", !show);
  $("guide-toggle").setAttribute("aria-expanded", String(show));
  $("guide-toggle").replaceChildren(
    document.createTextNode(show ? "Hide Atlas " : "Open Atlas "),
  );
  const arrow = document.createElement("span");
  arrow.textContent = show ? "↙" : "↗";
  $("guide-toggle").append(arrow);
}
function toggleGuide() {
  showGuide(document.body.classList.contains("guide-hidden"));
}
$("guide-toggle").onclick = toggleGuide;
$("rail-guide").onclick = toggleGuide;
function toggleSearch() {
  const open = $("map-search").hidden;
  $("map-search").hidden = !open;
  $("search-form").hidden = false;
  if (open) $("search-input").focus();
}
$("map-search-button").onclick = toggleSearch;
$("search-toggle").onclick = toggleSearch;
$("search-form").addEventListener("submit", () => {
  showGuide(true);
  $("map-search").hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("map-search").hidden = true;
});
// A direct file:// launch cannot load modules. index.html also has a small inline
// notice for that case, so setup problems are visible before this file executes.
