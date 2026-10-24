/* Progressive enhancement: every core operation works without JavaScript. */
const overlay = document.querySelector('.busy');
for (const form of document.querySelectorAll('form[data-busy]')) {
  form.addEventListener('submit', () => {
    if (form.checkValidity()) {
      overlay.hidden = false;
      form.setAttribute('aria-busy', 'true');
    }
  });
}
window.addEventListener('pageshow', () => {
  overlay.hidden = true;
  for (const form of document.querySelectorAll('[aria-busy]')) form.removeAttribute('aria-busy');
});
for (const button of document.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    const field = document.getElementById('query');
    field.value = button.dataset.prompt;
    field.focus();
  });
}
const plot = document.getElementById('plot');
if (plot) {
  const update = () => {
    const count = plot.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('word-count').textContent = `${count} words · at least 10 needed`;
    plot.setCustomValidity(count < 10 ? 'Please provide a plot of at least 10 words.' : '');
  };
  plot.addEventListener('input', update);
  update();
}
