import { LAND, pointInPolygon, spherePoint } from './geography.js';
import { clamp } from '../../utils/random.js';
let landPoints;
function getLandPoints() {
    if (!landPoints) {
        landPoints = [];
        for (let lat = -58; lat <= 82; lat += 1.5)
            for (let lon = -180; lon < 180; lon += 1.5)
                if (LAND.some(poly => pointInPolygon(lon, lat, poly)))
                    landPoints.push(spherePoint(lat, lon));
    }
    return landPoints;
}
/** Actual 3D sphere coordinates, yaw/pitch rotation, perspective projection,
 * and backface culling, rendered with Canvas. No flat-map camera illusion. */
export class Globe {
    constructor(canvas, { onSelect = () => { }, interactive = true } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.yaw = .5;
        this.pitch = .22;
        this.zoom = 1;
        this.markers = [];
        this.onSelect = onSelect;
        this.controller = new AbortController();
        if (interactive) {
            const opts = { signal: this.controller.signal };
            canvas.addEventListener('pointerdown', e => { this.drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY }; canvas.setPointerCapture(e.pointerId); }, opts);
            canvas.addEventListener('pointermove', e => { if (this.drag) {
                this.yaw += (e.clientX - this.drag.x) * .006;
                this.pitch = clamp(this.pitch + (e.clientY - this.drag.y) * .005, -1.4, 1.4);
                this.drag.x = e.clientX;
                this.drag.y = e.clientY;
            } }, opts);
            canvas.addEventListener('pointerup', e => { if (this.drag && Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY) < 6)
                this.select(e); this.drag = null; }, opts);
            canvas.addEventListener('pointercancel', () => this.drag = null, opts);
            canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoom = clamp(this.zoom - e.deltaY * .001, .7, 1.6); }, { ...opts, passive: false });
            canvas.addEventListener('keydown', e => { const k = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(k))
                e.preventDefault(); if (k === 'ArrowLeft')
                this.yaw -= .12; if (k === 'ArrowRight')
                this.yaw += .12; if (k === 'ArrowUp')
                this.pitch = clamp(this.pitch - .1, -1.4, 1.4); if (k === 'ArrowDown')
                this.pitch = clamp(this.pitch + .1, -1.4, 1.4); if (k === '+' || k === '=')
                this.zoom = clamp(this.zoom + .1, .7, 1.6); if (k === '-')
                this.zoom = clamp(this.zoom - .1, .7, 1.6); }, opts);
        }
    }
    project(point, w, h, r) {
        const [x, y, z] = point, cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
        const x1 = x * cy + z * sy, z1 = z * cy - x * sy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const scale = 3 / (3 - z2 * .15);
        return { x: w / 2 + x1 * r * scale, y: h / 2 - y2 * r * scale, z: z2 };
    }
    setMarkers(markers) { this.markers = markers; }
    focus(location) { this.yaw = -location.lon * Math.PI / 180; this.pitch = location.lat * Math.PI / 180; }
    select(event) {
        const rect = this.canvas.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width * this.w, y = (event.clientY - rect.top) / rect.height * this.h;
        const candidates = (this.hitMarkers || []).filter(p => Math.hypot(p.x - x, p.y - y) < 18).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
        if (candidates[0])
            this.onSelect(candidates[0].marker);
    }
    draw(time = 0, auto = false) {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || 500, h = rect.height || 400, dpr = Math.min(devicePixelRatio || 1, 2);
        this.w = w;
        this.h = h;
        if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
            this.canvas.width = Math.round(w * dpr);
            this.canvas.height = Math.round(h * dpr);
        }
        const c = this.ctx;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, h);
        const r = Math.min(w, h) * .39 * this.zoom;
        if (auto && !this.drag)
            this.yaw += .0015;
        // A deterministic star field gives the globe depth without a texture download.
        for (let i = 0; i < 95; i++) {
            const x = (Math.sin(i * 91.73) * .5 + .5) * w, y = (Math.sin(i * 37.11 + 2) * .5 + .5) * h;
            const twinkle = .25 + (Math.sin(time * .8 + i) + 1) * .14;
            c.fillStyle = `rgba(218,233,255,${twinkle})`;
            c.fillRect(x, y, i % 13 === 0 ? 1.8 : 1, i % 13 === 0 ? 1.8 : 1);
        }
        const glow = c.createRadialGradient(w / 2, h / 2, r * .82, w / 2, h / 2, r * 1.3);
        glow.addColorStop(0, '#62ddff38');
        glow.addColorStop(.72, '#277bff18');
        glow.addColorStop(1, '#774cff00');
        c.fillStyle = glow;
        c.fillRect(0, 0, w, h);
        const shade = c.createRadialGradient(w / 2 - r * .35, h / 2 - r * .45, 0, w / 2, h / 2, r);
        shade.addColorStop(0, '#1da7d8');
        shade.addColorStop(.38, '#0e659f');
        shade.addColorStop(.78, '#0a315f');
        shade.addColorStop(1, '#04162f');
        c.fillStyle = shade;
        c.beginPath();
        c.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        c.fill();
        c.save();
        c.beginPath();
        c.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        c.clip();
        const sparkle = c.createRadialGradient(w / 2 - r * .42, h / 2 - r * .5, 0, w / 2 - r * .42, h / 2 - r * .5, r * .72);
        sparkle.addColorStop(0, '#d7fbff55');
        sparkle.addColorStop(.18, '#7ae8ff22');
        sparkle.addColorStop(1, '#ffffff00');
        c.fillStyle = sparkle;
        c.fillRect(w / 2 - r, h / 2 - r, r * 2, r * 2);
        const line = points => { c.beginPath(); let begun = false; for (const point of points) {
            const p = this.project(point, w, h, r);
            if (p.z < .03) {
                begun = false;
                continue;
            }
            if (begun)
                c.lineTo(p.x, p.y);
            else
                c.moveTo(p.x, p.y);
            begun = true;
        } c.stroke(); };
        c.strokeStyle = '#a9efff20';
        for (let lat = -60; lat <= 60; lat += 30)
            line(Array.from({ length: 181 }, (_, i) => spherePoint(lat, i * 2 - 180)));
        for (let lon = -180; lon < 180; lon += 30)
            line(Array.from({ length: 91 }, (_, i) => spherePoint(i * 2 - 90, lon)));
        for (const point of getLandPoints()) {
            const p = this.project(point, w, h, r);
            if (p.z <= .03)
                continue;
            const polar = Math.abs(point[1]);
            const light = Math.max(.24, Math.min(1, .38 + p.z * .48 + (w / 2 - p.x) / r * .16));
            c.fillStyle = polar > .82 ? `rgba(236,246,230,${light})` : polar > .55 ? `rgba(116,153,92,${light})` : `rgba(74,137,72,${light})`;
            const size = Math.max(1, r * .0065);
            c.fillRect(p.x, p.y, size, size);
        }
        // Thin moving cloud bands sit above the land layer.
        c.lineWidth = Math.max(1.4, r * .008);
        c.strokeStyle = '#ffffff18';
        c.setLineDash([r * .12, r * .055]);
        for (let band = -1; band <= 1; band++) {
            c.beginPath();
            c.ellipse(w / 2 + Math.sin(time * .05 + band) * r * .05, h / 2 + band * r * .34, r * .88, r * (.12 + Math.abs(band) * .015), -.08, 0, Math.PI * 2);
            c.stroke();
        }
        c.setLineDash([]);
        const night = c.createLinearGradient(w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r);
        night.addColorStop(0, '#02081700');
        night.addColorStop(.56, '#02081708');
        night.addColorStop(1, '#01040bd0');
        c.fillStyle = night;
        c.fillRect(w / 2 - r, h / 2 - r, r * 2, r * 2);
        c.restore();
        c.strokeStyle = '#86e9ffbb';
        c.lineWidth = Math.max(1.5, r * .009);
        c.beginPath();
        c.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = '#d8f8ff32';
        c.lineWidth = Math.max(3, r * .025);
        c.beginPath();
        c.arc(w / 2, h / 2, r * 1.012, Math.PI * .72, Math.PI * 1.72);
        c.stroke();
        this.hitMarkers = [];
        for (const marker of this.markers) {
            const p = this.project(spherePoint(marker.location.lat, marker.location.lon), w, h, r * 1.01);
            if (p.z < .1)
                continue;
            this.hitMarkers.push({ ...p, marker });
            c.strokeStyle = marker.discovered ? '#ffd84a' : '#ff70af';
            c.fillStyle = marker.discovered ? '#ffd84a' : '#ff70af';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(p.x, p.y + 11);
            c.lineTo(p.x, p.y + 3);
            c.stroke();
            c.beginPath();
            c.arc(p.x, p.y, 5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(p.x - 1.5, p.y - 1.5, 1.4, 0, Math.PI * 2);
            c.fill();
            c.globalAlpha = .3;
            c.beginPath();
            c.arc(p.x, p.y, 8 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
            c.stroke();
            c.globalAlpha = 1;
            if (marker.selected) {
                c.font = 'bold 12px sans-serif';
                const width = c.measureText(marker.name).width + 16;
                c.fillStyle = '#0a153be6';
                c.fillRect(p.x + 10, p.y - 13, width, 24);
                c.strokeStyle = '#78e7ff88';
                c.strokeRect(p.x + 10, p.y - 13, width, 24);
                c.fillStyle = '#fff8df';
                c.fillText(marker.name, p.x + 18, p.y + 3);
            }
        }
    }
    destroy() { this.controller.abort(); }
}
