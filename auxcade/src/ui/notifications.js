import { escapeHtml } from '../utils/dom.js';
export function notify(message, type = 'info') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    document.querySelector('#notifications').append(node);
    setTimeout(() => node.remove(), 6500);
}
export function achievementPopup(achievement) {
    const node = document.createElement('div');
    node.className = 'toast achievement-toast';
    node.innerHTML = `<span class="achievement-star">✦</span><div><span class="eyebrow">ACHIEVEMENT UNLOCKED</span><strong>${escapeHtml(achievement.name)}</strong><small>+${achievement.coins} coins · +${achievement.tickets} tickets</small></div>`;
    document.querySelector('#notifications').append(node);
    setTimeout(() => node.remove(), 7500);
}
export function dialog(title, content, actions = []) {
    const previous = document.activeElement;
    const node = document.createElement('dialog');
    node.className = 'modal';
    node.innerHTML = `<div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="icon-button" aria-label="Close dialog">×</button></div><div class="modal-content">${content}</div><div class="button-row">${actions.map((a, i) => `<button class="button ${a.primary ? 'primary' : ''}" data-action="${i}">${escapeHtml(a.label)}</button>`).join('')}</div>`;
    document.body.append(node);
    node.showModal();
    const close = () => { node.close(); node.remove(); previous?.focus(); };
    node.querySelector('.icon-button').onclick = close;
    node.addEventListener('cancel', event => { event.preventDefault(); close(); });
    node.querySelectorAll('[data-action]').forEach(button => button.onclick = () => actions[Number(button.dataset.action)].action(close, node));
    return { node, close };
}
