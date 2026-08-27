/*
  SIGNAL LAB — INTERACTION LAYER
  ------------------------------
  Vanilla JavaScript only. Each major feature is kept in its own initialization
  function so you can remove, extend, or debug one interaction without touching
  the others.
*/

(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const DATA = window.PORTFOLIO_DATA;
  if (!DATA) {
    console.error("Signal Lab: PORTFOLIO_DATA was not found. Check that data.js loads before app.js.");
    return;
  }

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Escape user-facing strings before injecting data.js content into HTML.
  const escapeHTML = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function renderStaticContent() {
    $("#heroRole").textContent = DATA.person.role;
    $("#heroSchool").textContent = `${DATA.person.school} // ${DATA.person.graduation}`;
    $("#heroLine").textContent = DATA.person.tagline;
    $("#resumeLink").href = DATA.person.resume;

    $("#siteNav").innerHTML = DATA.navigation.map(item =>
      `<a href="#${escapeHTML(item.target)}" data-nav-target="${escapeHTML(item.target)}"><span>${escapeHTML(item.channel)}</span> ${escapeHTML(item.label)}</a>`
    ).join("");

    $("#bioCopy").innerHTML = DATA.person.bio.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("");
    $("#currentCuriosity").textContent = DATA.person.curiosity;
    const aboutFacts = $("#aboutFacts");
    if (aboutFacts && Array.isArray(DATA.person.facts) && DATA.person.facts.length) {
      aboutFacts.innerHTML = DATA.person.facts.map(fact => `
        <div class="source-fact">
          <span>${escapeHTML(fact.label)}</span>
          <strong>${escapeHTML(fact.value)}</strong>
        </div>
      `).join("");
    }

    $("#interestPreview").innerHTML = DATA.interests.map(interest => `
      <a class="interest-mini" href="#interests" data-preview-interest="${escapeHTML(interest.id)}">
        <strong>${escapeHTML(interest.title)}</strong>
        <span>${escapeHTML(interest.frequency.toFixed(1))} MHz</span>
      </a>
    `).join("");

    renderSkills();
    renderProjects();
    renderExperience();
    renderContactLinks();
    renderCredits();
    $("#year").textContent = `© ${new Date().getFullYear()}`;
  }

  function renderSkills() {
    $("#skillsGrid").innerHTML = DATA.skills.map(group => `
      <section class="skill-group">
        <h4>${escapeHTML(group.category)}</h4>
        <div class="skill-list">
          ${group.items.map(skill => {
            const ids = skill.projects.join(" ");
            const useful = skill.projects.length > 0;
            return `<button class="skill-chip" type="button" ${useful ? `data-projects="${escapeHTML(ids)}"` : ""} aria-label="${escapeHTML(skill.name)}${useful ? "; highlight related projects" : ""}">${escapeHTML(skill.name)}</button>`;
          }).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderProjects() {
    $("#projectsGrid").innerHTML = DATA.projects.map(project => {
      const visual = project.image
        ? `<div class="project-visual"><img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.imageAlt)}" loading="lazy"></div>`
        : `<div class="project-visual project-placeholder"><span>[ ${escapeHTML(project.note || "SIGNAL NOT DETECTED")} ]</span></div>`;

      const actions = [
        project.demo ? `<a class="button button--small" href="${escapeHTML(project.demo)}">View live site</a>` : "",
        project.source ? `<a class="button button--small" href="${escapeHTML(project.source)}" target="_blank" rel="noreferrer">${escapeHTML(project.sourceLabel || "Source code")} ↗</a>` : (project.sourceLabel ? `<span class="source-unavailable">${escapeHTML(project.sourceLabel)}</span>` : "")
      ].filter(Boolean).join("");

      return `
        <article class="project-card instrument-panel reveal" id="work-${escapeHTML(project.id)}" data-project-id="${escapeHTML(project.id)}">
          <div class="project-head">
            <span class="eyebrow">${escapeHTML(project.eyebrow)}</span>
            <span class="status-chip"><span class="status-led status-led--active" aria-hidden="true"></span>${escapeHTML(project.status)}</span>
          </div>
          ${visual}
          <h3>${escapeHTML(project.title)}</h3>
          <p>${escapeHTML(project.description)}</p>
          <div class="project-tags">${project.technologies.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
          ${actions ? `<div class="project-actions">${actions}</div>` : ""}
          <p class="project-note">${escapeHTML(project.note || "")}</p>
          ${renderProjectDemo(project)}
        </article>
      `;
    }).join("");
  }

  function renderProjectDemo(project) {
    if (project.type === "c0vm") {
      return `
        <div class="project-demo" data-vm-demo>
          <div class="demo-heading"><strong>MINI C0VM // STACK MACHINE</strong><div><button class="demo-button" type="button" data-vm-action="step">STEP</button> <button class="demo-button" type="button" data-vm-action="run">RUN</button> <button class="demo-button" type="button" data-vm-action="reset">RESET</button></div></div>
          <div class="vm-demo-grid">
            <div class="bytecode" data-vm-code aria-label="Bytecode instructions"></div>
            <div class="vm-stack" data-vm-stack aria-label="Virtual machine stack"></div>
          </div>
          <div class="vm-status" data-vm-status aria-live="polite">Ready. Execute PUSH 5.</div>
        </div>`;
    }

    if (project.type === "i2c") {
      return `
        <div class="project-demo i2c-demo" data-i2c-demo>
          <div class="demo-heading"><strong>I2C BUS // SIMULATION</strong><button class="demo-button" type="button" data-i2c-send>SEND DATA</button></div>
          <div class="i2c-devices"><div class="i2c-device">MCU<br>0x00</div><div class="i2c-device">TEMP SENSOR<br>0x48</div><div class="i2c-device">LCD<br>0x27</div></div>
          <div class="i2c-bus"><span class="i2c-packet"></span></div>
          <div class="vm-status" data-i2c-status aria-live="polite">Bus idle. SDA HIGH // SCL HIGH</div>
        </div>`;
    }

    return "";
  }

  function renderExperience() {
    $("#timeline").innerHTML = DATA.experience.map(entry => `
      <article class="timeline-entry reveal" id="work-${escapeHTML(entry.id || entry.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}" data-work-id="${escapeHTML(entry.id || "")}">
        <div class="timeline-date">${escapeHTML(entry.date)}</div>
        <div class="timeline-card instrument-panel">
          <span class="eyebrow">${escapeHTML(entry.location)}</span>
          <h3>${escapeHTML(entry.company)}</h3>
          <p class="timeline-role">${escapeHTML(entry.role)}</p>
          <ul>${entry.bullets.map(bullet => `<li>${escapeHTML(bullet)}</li>`).join("")}</ul>
          <div class="metric-grid">${entry.metrics.map(metric => `<div class="metric">${escapeHTML(metric)}</div>`).join("")}</div>
          ${renderExperienceVisual(entry.visual)}
        </div>
      </article>
    `).join("");
  }

  function renderExperienceVisual(type) {
    if (type === "network") return `<div class="timeline-visual network-visual" aria-hidden="true"><span class="packet"></span><span class="packet"></span><span class="packet"></span></div>`;
    if (type === "chart") return `<div class="timeline-visual chart-visual" aria-hidden="true">${[38,55,42,68,63,81,72,94,80,100,91,112].map(h => `<span style="height:${h / 1.35}%"></span>`).join("")}</div>`;
    return `<div class="timeline-visual teaching-visual" aria-hidden="true">${Array.from({ length: 36 }, () => "<span></span>").join("")}</div>`;
  }

  function renderContactLinks() {
    $("#contactLinks").innerHTML = DATA.contacts.map(contact => `
      <a class="contact-link" href="${escapeHTML(contact.href)}" ${contact.href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>
        <span class="contact-code">${escapeHTML(contact.code)}</span>
        <span><strong>${escapeHTML(contact.label)}</strong><br><small>${escapeHTML(contact.value)}</small></span>
        <span aria-hidden="true">↗</span>
      </a>
    `).join("");
  }

  function renderCredits() {
    $("#creditsList").innerHTML = DATA.credits.map(item => `<li>${escapeHTML(item)}</li>`).join("");
  }

  // ---------- Power-on experience ----------
  function initBootSequence() {
    const boot = $("#bootScreen");
    const powerSwitch = $("#powerSwitch");
    const skip = $("#skipBoot");
    const log = $("#bootLog");
    const seenKey = "signalLabBootSeen";

    const finish = () => {
      boot.classList.add("is-hidden");
      try { localStorage.setItem(seenKey, "true"); } catch (_) { /* localStorage may be unavailable in privacy modes. */ }
      setTimeout(() => boot.setAttribute("aria-hidden", "true"), 600);
    };

    const bootMessages = [
      ["POWER", "OK"],
      ["DISPLAY", "OK"],
      ["NETWORK", "CONNECTED"],
      ["PORTFOLIO", "LOADED"],
      ["SIGNAL", "LOCKED"]
    ];

    const run = () => {
      if (boot.classList.contains("is-powered")) return;
      boot.classList.add("is-powered");
      powerSwitch.setAttribute("aria-pressed", "true");
      $("#bootTitle").textContent = "WARMING UP";

      if (reducedMotion.matches) {
        log.innerHTML = bootMessages.map(([left, right]) => `<span>${left}<strong>${right}</strong></span>`).join("");
        $("#bootTitle").textContent = "READY";
        setTimeout(finish, 120);
        return;
      }

      bootMessages.forEach(([left, right], index) => {
        setTimeout(() => {
          const row = document.createElement("span");
          row.innerHTML = `${escapeHTML(left)}<strong>${escapeHTML(right)}</strong>`;
          log.append(row);
          if (index === bootMessages.length - 1) {
            $("#bootTitle").textContent = "READY";
            setTimeout(finish, 550);
          }
        }, 190 * (index + 1));
      });
    };

    powerSwitch.addEventListener("click", run);
    skip.addEventListener("click", finish);

    let hasSeen = false;
    try { hasSeen = localStorage.getItem(seenKey) === "true"; } catch (_) { /* ignore */ }
    if (hasSeen) finish();
  }

  // ---------- Navigation / smooth section awareness ----------
  function initNavigation() {
    const nav = $("#siteNav");
    const toggle = $("#menuToggle");

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", event => {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    const sections = DATA.navigation.map(item => document.getElementById(item.target)).filter(Boolean);
    const navLinks = $$('[data-nav-target]');
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle("is-active", link.dataset.navTarget === visible.target.id));
    }, { rootMargin: "-25% 0px -60%", threshold: [0, .2, .5, .8] });
    sections.forEach(section => observer.observe(section));
  }

  // ---------- Reveal elements on scroll ----------
  function initRevealAnimations() {
    const reveals = $$(".reveal");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      reveals.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    reveals.forEach(el => observer.observe(el));
  }

  // ---------- Scroll-aware vertical signal rail ----------
  function initSignalRail() {
    const progress = $("#signalProgress");
    const probe = $("#signalProbe");
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      progress.style.height = `${pct}%`;
      probe.style.top = `${pct}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  // ---------- Interactive oscilloscope ----------
  function initOscilloscope() {
    const canvas = $("#scopeCanvas");
    const scope = $("#scope");
    const readout = $("#scopeReadout");
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    let pointerX = .55;
    let pointerY = .5;
    let phase = 0;
    let width = canvas.width;
    let height = canvas.height;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(300, Math.round(rect.width * dpr));
      height = Math.max(170, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
    };

    const onPointer = event => {
      const rect = canvas.getBoundingClientRect();
      pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      readout.textContent = `${(.55 + pointerX * 1.45).toFixed(2)} kHz`;
    };

    const drawGrid = () => {
      ctx.fillStyle = "#243629";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(211,196,126,.16)";
      ctx.lineWidth = 1;
      const divisions = 10;
      for (let i = 0; i <= divisions; i++) {
        const x = (i / divisions) * width;
        const y = (i / divisions) * height;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(211,196,126,.28)";
      ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    };

    const drawWave = () => {
      drawGrid();
      const amplitude = height * (.12 + (1 - pointerY) * .17);
      const cycles = 2.3 + pointerX * 4.2;
      ctx.save();
      ctx.shadowColor = "rgba(225,198,108,.30)";
      ctx.shadowBlur = 4;
      ctx.strokeStyle = "#e1c66c";
      ctx.lineWidth = Math.max(1.5, width / 700);
      ctx.beginPath();
      for (let x = 0; x <= width; x += Math.max(1, width / 620)) {
        const normalized = x / width;
        const harmonic = Math.sin(normalized * Math.PI * 2 * cycles + phase);
        const secondary = Math.sin(normalized * Math.PI * 2 * (cycles * 2.02) + phase * .7) * .14;
        const y = height / 2 + (harmonic + secondary) * amplitude;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      phase += reducedMotion.matches ? 0 : .026;
      requestAnimationFrame(drawWave);
    };

    scope.addEventListener("pointermove", onPointer);
    window.addEventListener("resize", resize);
    resize();
    drawWave();
  }

  // ---------- Skills -> related work connections ----------
  // Skills may point to project IDs OR experience IDs. Clicking a skill keeps
  // the selection active; hovering/focusing previews it temporarily.
  function initSkillConnections() {
    const chips = $$(".skill-chip");
    const cards = $$(".project-card[data-project-id], .timeline-entry[data-work-id]");
    const status = $("#skillRelationStatus");
    let selectedChip = null;

    const getId = card => card.dataset.projectId || card.dataset.workId || "";
    const getTitle = card => $("h3", card)?.textContent?.trim() || getId(card);

    const clearCards = () => cards.forEach(card => card.classList.remove("is-highlighted", "is-dimmed"));

    const show = (chip, persistent = false) => {
      const targets = (chip.dataset.projects || "").split(/\s+/).filter(Boolean);
      if (!targets.length) {
        clearCards();
        if (status) status.innerHTML = `<strong>${escapeHTML(chip.textContent.trim())}</strong> — no featured work is mapped to this skill yet.`;
        return;
      }

      const matches = cards.filter(card => targets.includes(getId(card)));
      cards.forEach(card => {
        const match = targets.includes(getId(card));
        card.classList.toggle("is-highlighted", match);
        card.classList.toggle("is-dimmed", !match);
      });

      if (status) {
        const links = matches.map(card => `<a href="#${escapeHTML(card.id)}">${escapeHTML(getTitle(card))}</a>`).join(" · ");
        status.innerHTML = `<strong>${escapeHTML(chip.textContent.trim())}</strong> → ${links || "No matching cards found."}${persistent ? " <span class=\"muted\">(selected)</span>" : ""}`;
      }
    };

    const restore = () => {
      if (selectedChip) show(selectedChip, true);
      else {
        clearCards();
        if (status) status.textContent = "Choose a skill to see the related work.";
      }
    };

    // Related-work links use delegated navigation so the first click always
    // completes, even when focus moves away from the selected skill button.
    if (status) {
      status.addEventListener("click", event => {
        const link = event.target.closest('a[href^="#work-"]');
        if (!link) return;
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
        try { history.replaceState(null, "", link.getAttribute("href")); } catch (_) { /* ignore */ }
      });
    }

    chips.forEach(chip => {
      const useful = Boolean(chip.dataset.projects);
      chip.setAttribute("aria-pressed", "false");
      if (!useful) chip.setAttribute("aria-disabled", "true");

      chip.addEventListener("mouseenter", () => { if (useful) show(chip, false); });
      chip.addEventListener("mouseleave", restore);
      chip.addEventListener("focus", () => { if (useful) show(chip, selectedChip === chip); });
      chip.addEventListener("blur", () => {
        // Do not rebuild the related-work links while the selected skill loses
        // focus. Replacing those anchors during pointer-down caused the first
        // click on a related-work link to be swallowed by the browser.
        if (selectedChip === chip) return;
        window.setTimeout(restore, 0);
      });
      chip.addEventListener("click", () => {
        if (!useful) { show(chip, false); return; }
        if (selectedChip === chip) {
          chip.classList.remove("is-selected");
          chip.setAttribute("aria-pressed", "false");
          selectedChip = null;
          restore();
          return;
        }
        chips.forEach(item => { item.classList.remove("is-selected"); item.setAttribute("aria-pressed", "false"); });
        selectedChip = chip;
        chip.classList.add("is-selected");
        chip.setAttribute("aria-pressed", "true");
        show(chip, true);
      });
    });
  }

  // ---------- Tiny educational C0VM-inspired stack demo ----------
  function initVMDemo() {
    const root = $("[data-vm-demo]");
    if (!root) return;

    const program = [
      { text: "PUSH 5", exec: s => s.push(5) },
      { text: "PUSH 3", exec: s => s.push(3) },
      { text: "IADD", exec: s => s.push((s.pop() || 0) + (s.pop() || 0)) },
      { text: "PUSH 2", exec: s => s.push(2) },
      { text: "IMUL", exec: s => s.push((s.pop() || 0) * (s.pop() || 0)) },
      { text: "RETURN", exec: () => {} }
    ];
    const codeEl = $("[data-vm-code]", root);
    const stackEl = $("[data-vm-stack]", root);
    const status = $("[data-vm-status]", root);
    let stack = [];
    let pc = 0;
    let runTimer = null;

    const render = () => {
      codeEl.innerHTML = program.map((instruction, index) => `<div class="bytecode-row ${index === pc ? "is-current" : ""} ${index < pc ? "is-done" : ""}"><span>${String(index).padStart(2, "0")}</span><span>${instruction.text}</span></div>`).join("");
      stackEl.innerHTML = stack.length ? stack.map(value => `<div class="stack-value">${value}</div>`).join("") : `<div class="muted" style="font: .7rem 'SFMono-Regular',Consolas,monospace; text-align:center; margin:auto">STACK EMPTY</div>`;
    };

    const step = () => {
      if (pc >= program.length) {
        status.textContent = `Program complete. Return value: ${stack.at(-1) ?? "—"}`;
        return false;
      }
      const instruction = program[pc];
      instruction.exec(stack);
      pc += 1;
      status.textContent = pc >= program.length
        ? `Program complete. Return value: ${stack.at(-1) ?? "—"}`
        : `Executed ${instruction.text}. Next: ${program[pc].text}`;
      render();
      return pc < program.length;
    };

    const reset = () => {
      if (runTimer) clearInterval(runTimer);
      runTimer = null;
      stack = [];
      pc = 0;
      status.textContent = "Ready. Execute PUSH 5.";
      render();
    };

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-vm-action]");
      if (!button) return;
      const action = button.dataset.vmAction;
      if (action === "step") step();
      if (action === "reset") reset();
      if (action === "run") {
        if (runTimer) return;
        runTimer = setInterval(() => {
          if (!step()) {
            clearInterval(runTimer);
            runTimer = null;
          }
        }, reducedMotion.matches ? 60 : 430);
      }
    });

    render();
  }

  // ---------- I2C pulse demo ----------
  function initI2CDemo() {
    const root = $("[data-i2c-demo]");
    if (!root) return;
    const button = $("[data-i2c-send]", root);
    const status = $("[data-i2c-status]", root);
    let busy = false;

    button.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      root.classList.remove("is-running");
      void root.offsetWidth; // restart CSS animation intentionally
      root.classList.add("is-running");
      status.textContent = "START → ADDR 0x48 → READ TEMP_REGISTER → ACK";
      setTimeout(() => { status.textContent = "TEMP_REGISTER → 0x19 // 25°C → LCD 0x27"; }, reducedMotion.matches ? 80 : 1050);
      setTimeout(() => {
        status.textContent = "STOP // Bus idle. SDA HIGH // SCL HIGH";
        root.classList.remove("is-running");
        busy = false;
      }, reducedMotion.matches ? 160 : 2250);
    });
  }

  // ---------- Interest tuner ----------
  function initTuner() {
    const scale = $("#frequencyScale");
    const display = $("#interestDisplay");
    const value = $("#frequencyValue");
    const knob = $("#tunerKnob");
    let index = 0;

    scale.innerHTML = DATA.interests.map((interest, i) => `<button class="frequency-button" type="button" role="tab" aria-selected="${i === 0}" data-interest-index="${i}">${interest.frequency.toFixed(1)}<br>${escapeHTML(interest.title)}</button>`).join("");

    const select = nextIndex => {
      index = (nextIndex + DATA.interests.length) % DATA.interests.length;
      const interest = DATA.interests[index];
      value.textContent = interest.frequency.toFixed(1);
      $$(".frequency-button", scale).forEach((button, i) => button.setAttribute("aria-selected", String(i === index)));
      knob.style.transform = `rotate(${-120 + index * 80}deg)`;
      renderInterest(display, interest);
    };

    scale.addEventListener("click", event => {
      const button = event.target.closest("[data-interest-index]");
      if (button) select(Number(button.dataset.interestIndex));
    });
    knob.addEventListener("click", () => select(index + 1));
    knob.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); select(index + 1); }
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); select(index - 1); }
    });

    $$("[data-preview-interest]").forEach(link => link.addEventListener("click", () => {
      const idx = DATA.interests.findIndex(interest => interest.id === link.dataset.previewInterest);
      if (idx >= 0) setTimeout(() => select(idx), 50);
    }));

    select(0);
  }

  function renderInterest(container, interest) {
    container.innerHTML = `
      <div class="panel-meta"><span>${escapeHTML(interest.code)}</span><span>LOCKED // ${interest.frequency.toFixed(1)} MHz</span></div>
      <h3>${escapeHTML(interest.title)}</h3>
      <p>${escapeHTML(interest.description)}</p>
      <div class="interactive-stage" data-interest-stage></div>
    `;
    const stage = $("[data-interest-stage]", container);
    if (interest.interactive === "tennis") buildTennis(stage);
    if (interest.interactive === "music") buildMusic(stage, interest);
    if (interest.interactive === "drawing") buildSketch(stage);
    if (interest.interactive === "tv") buildTV(stage, interest.channels || []);
  }

  function buildTennis(stage) {
    /*
      RETRO TENNIS MINI-GAME
      ----------------------
      A small Pong/tennis-inspired game written directly with the Canvas API.
      No library or image assets are required.

      DESKTOP: click the court, then use Left/Right (or A/D). Press Space to serve.
      MOBILE: use the on-screen buttons, or drag your pointer/finger across the court.

      The scoring follows a single tennis game: 0, 15, 30, 40, deuce, advantage.
    */
    stage.classList.add("tennis-stage");
    stage.innerHTML = `
      <div class="tennis-game-shell">
        <div class="tennis-scoreboard" aria-live="polite">
          <span>CPU // <strong data-tennis-cpu-score>0</strong></span>
          <span class="tennis-status-cell" data-tennis-score-status>PRESS SERVE</span>
          <span>YOU // <strong data-tennis-player-score>0</strong></span>
        </div>
        <canvas class="tennis-court" data-tennis-canvas width="720" height="360" tabindex="0" aria-label="Playable tennis game. Use left and right arrow keys or A and D to move. Press Space to serve."></canvas>
        <div class="tennis-help">
          <span>KEYS: ← → / A D &nbsp;•&nbsp; SPACE = SERVE</span>
          <span>FIRST PLAYER TO WIN A TENNIS GAME WINS</span>
        </div>
        <div class="tennis-controls" aria-label="Tennis game controls">
          <button class="tennis-control" type="button" data-tennis-left>◀ LEFT</button>
          <button class="tennis-control" type="button" data-tennis-serve>SERVE</button>
          <button class="tennis-control" type="button" data-tennis-right>RIGHT ▶</button>
          <button class="tennis-control" type="button" data-tennis-reset>RESET</button>
        </div>
        <div class="tennis-message" data-tennis-message>Click the court or press SERVE to begin.</div>
      </div>`;

    const canvas = $("[data-tennis-canvas]", stage);
    const ctx = canvas.getContext("2d");
    const playerScoreEl = $("[data-tennis-player-score]", stage);
    const cpuScoreEl = $("[data-tennis-cpu-score]", stage);
    const scoreStatusEl = $("[data-tennis-score-status]", stage);
    const messageEl = $("[data-tennis-message]", stage);

    const W = canvas.width;
    const H = canvas.height;
    const racketWidth = 104;
    const racketHeight = 9;
    const player = { x: (W - racketWidth) / 2, y: H - 30, w: racketWidth, h: racketHeight };
    const cpu = { x: (W - racketWidth) / 2, y: 21, w: racketWidth, h: racketHeight };
    const ball = { x: W / 2, y: player.y - 12, r: 8, vx: 0, vy: 0 };

    let playerPoints = 0;
    let cpuPoints = 0;
    let waitingForServe = true;
    let gameOver = false;
    let lastTime = performance.now();
    let playerVelocity = 0;
    const keys = { left: false, right: false };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const tennisScore = (mine, theirs) => {
      const labels = ["0", "15", "30", "40"];
      if (mine >= 3 && theirs >= 3) {
        if (mine === theirs) return "40";
        if (mine === theirs + 1) return "AD";
        return "40";
      }
      return labels[Math.min(mine, 3)];
    };

    const updateScoreboard = () => {
      playerScoreEl.textContent = tennisScore(playerPoints, cpuPoints);
      cpuScoreEl.textContent = tennisScore(cpuPoints, playerPoints);

      if (gameOver) return;
      if (playerPoints >= 3 && cpuPoints >= 3) {
        if (playerPoints === cpuPoints) scoreStatusEl.textContent = "DEUCE";
        else if (playerPoints > cpuPoints) scoreStatusEl.textContent = "ADVANTAGE YOU";
        else scoreStatusEl.textContent = "ADVANTAGE CPU";
      } else {
        scoreStatusEl.textContent = waitingForServe ? "PRESS SERVE" : "PLAY";
      }
    };

    const resetBall = () => {
      waitingForServe = true;
      ball.vx = 0;
      ball.vy = 0;
      ball.x = player.x + player.w / 2;
      ball.y = player.y - ball.r - 3;
      messageEl.textContent = "Your serve — press Space or SERVE.";
      updateScoreboard();
    };

    const resetGame = () => {
      playerPoints = 0;
      cpuPoints = 0;
      gameOver = false;
      player.x = (W - player.w) / 2;
      cpu.x = (W - cpu.w) / 2;
      resetBall();
      messageEl.textContent = "New game. Your serve.";
    };

    const serve = () => {
      canvas.focus({ preventScroll: true });
      if (gameOver) {
        resetGame();
        return;
      }
      if (!waitingForServe) return;
      waitingForServe = false;
      const direction = Math.random() < .5 ? -1 : 1;
      ball.vx = direction * (65 + Math.random() * 45);
      ball.vy = -260;
      messageEl.textContent = "Rally in progress.";
      updateScoreboard();
    };

    const pointWonBy = winner => {
      if (winner === "player") playerPoints += 1;
      else cpuPoints += 1;

      const winnerPoints = winner === "player" ? playerPoints : cpuPoints;
      const loserPoints = winner === "player" ? cpuPoints : playerPoints;
      const wonGame = winnerPoints >= 4 && winnerPoints - loserPoints >= 2;

      if (wonGame) {
        gameOver = true;
        waitingForServe = true;
        ball.vx = 0;
        ball.vy = 0;
        scoreStatusEl.textContent = winner === "player" ? "GAME — YOU WIN" : "GAME — CPU WINS";
        messageEl.textContent = winner === "player"
          ? "You won the game! Press RESET or SERVE for another."
          : "CPU takes the game. Press RESET or SERVE to try again.";
        playerScoreEl.textContent = winner === "player" ? "GAME" : tennisScore(playerPoints, cpuPoints);
        cpuScoreEl.textContent = winner === "cpu" ? "GAME" : tennisScore(cpuPoints, playerPoints);
      } else {
        messageEl.textContent = winner === "player" ? "Point to you." : "Point to CPU.";
        resetBall();
      }
    };

    const drawCourt = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#71815a";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "#f2ead2";
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 14, W - 80, H - 28);
      ctx.beginPath();
      ctx.moveTo(40, H / 2);
      ctx.lineTo(W - 40, H / 2);
      ctx.moveTo(W / 2, 14);
      ctx.lineTo(W / 2, H - 14);
      ctx.moveTo(40, H * .29);
      ctx.lineTo(W - 40, H * .29);
      ctx.moveTo(40, H * .71);
      ctx.lineTo(W - 40, H * .71);
      ctx.stroke();

      // Net drawn over the court center.
      ctx.strokeStyle = "#2f2b24";
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 7]);
      ctx.beginPath();
      ctx.moveTo(28, H / 2);
      ctx.lineTo(W - 28, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // CPU racket.
      ctx.fillStyle = "#e7ddc5";
      ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
      ctx.strokeStyle = "#2f2b24";
      ctx.lineWidth = 2;
      ctx.strokeRect(cpu.x, cpu.y, cpu.w, cpu.h);

      // Player racket.
      ctx.fillStyle = "#8b3f32";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.strokeRect(player.x, player.y, player.w, player.h);

      // Ball.
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#e4d85f";
      ctx.fill();
      ctx.strokeStyle = "#4d4a2d";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const update = dt => {
      const playerSpeed = 340;
      const previousX = player.x;
      if (keys.left) player.x -= playerSpeed * dt;
      if (keys.right) player.x += playerSpeed * dt;
      player.x = clamp(player.x, 40, W - 40 - player.w);
      playerVelocity = (player.x - previousX) / Math.max(dt, .001);

      // While waiting to serve, the ball sits on the player's racket.
      if (waitingForServe || gameOver) {
        ball.x = player.x + player.w / 2;
        ball.y = player.y - ball.r - 3;
        return;
      }

      // CPU follows the incoming ball, but with limited speed so it can miss.
      const cpuTarget = ball.vy < 0 ? ball.x - cpu.w / 2 : W / 2 - cpu.w / 2;
      const cpuSpeed = 205;
      const cpuDelta = clamp(cpuTarget - cpu.x, -cpuSpeed * dt, cpuSpeed * dt);
      cpu.x = clamp(cpu.x + cpuDelta, 40, W - 40 - cpu.w);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Side walls.
      if (ball.x - ball.r <= 40 && ball.vx < 0) {
        ball.x = 40 + ball.r;
        ball.vx *= -1;
      }
      if (ball.x + ball.r >= W - 40 && ball.vx > 0) {
        ball.x = W - 40 - ball.r;
        ball.vx *= -1;
      }

      // CPU return.
      if (
        ball.vy < 0 &&
        ball.y - ball.r <= cpu.y + cpu.h &&
        ball.y + ball.r >= cpu.y &&
        ball.x >= cpu.x - ball.r &&
        ball.x <= cpu.x + cpu.w + ball.r
      ) {
        const offset = (ball.x - (cpu.x + cpu.w / 2)) / (cpu.w / 2);
        ball.y = cpu.y + cpu.h + ball.r;
        ball.vy = Math.abs(ball.vy) * 1.035;
        ball.vx += offset * 90;
      }

      // Player return. Where the ball hits the racket changes the angle.
      if (
        ball.vy > 0 &&
        ball.y + ball.r >= player.y &&
        ball.y - ball.r <= player.y + player.h &&
        ball.x >= player.x - ball.r &&
        ball.x <= player.x + player.w + ball.r
      ) {
        const offset = (ball.x - (player.x + player.w / 2)) / (player.w / 2);
        ball.y = player.y - ball.r;
        ball.vy = -Math.abs(ball.vy) * 1.04;
        ball.vx += offset * 115 + playerVelocity * .06;
        ball.vx = clamp(ball.vx, -310, 310);
      }

      if (ball.y + ball.r < 0) pointWonBy("player");
      if (ball.y - ball.r > H) pointWonBy("cpu");
    };

    const loop = now => {
      // renderInterest() destroys this stage when the visitor tunes away.
      // Stop the animation loop when that happens so old games do not linger.
      if (!stage.isConnected) return;
      const dt = Math.min(.032, Math.max(.001, (now - lastTime) / 1000));
      lastTime = now;
      update(dt);
      drawCourt();
      requestAnimationFrame(loop);
    };

    const setPlayerFromPointer = event => {
      const rect = canvas.getBoundingClientRect();
      const scaledX = (event.clientX - rect.left) * (W / rect.width);
      player.x = clamp(scaledX - player.w / 2, 40, W - 40 - player.w);
      if (waitingForServe) ball.x = player.x + player.w / 2;
    };

    canvas.addEventListener("pointerdown", event => {
      canvas.focus({ preventScroll: true });
      setPlayerFromPointer(event);
    });
    canvas.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || event.buttons) setPlayerFromPointer(event);
    });

    canvas.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", " ", "a", "A", "d", "D"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
      if (event.key === " ") serve();
    });
    canvas.addEventListener("keyup", event => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
    });

    const bindHoldButton = (selector, key) => {
      const button = $(selector, stage);
      const on = event => { event.preventDefault(); keys[key] = true; canvas.focus({ preventScroll: true }); };
      const off = () => { keys[key] = false; };
      button.addEventListener("pointerdown", on);
      button.addEventListener("pointerup", off);
      button.addEventListener("pointercancel", off);
      button.addEventListener("pointerleave", off);
    };
    bindHoldButton("[data-tennis-left]", "left");
    bindHoldButton("[data-tennis-right]", "right");
    $("[data-tennis-serve]", stage).addEventListener("click", serve);
    $("[data-tennis-reset]", stage).addEventListener("click", resetGame);

    resetGame();
    requestAnimationFrame(loop);
  }

  async function buildMusic(stage, interest = {}) {
    stage.classList.add("spotify-stage");
    stage.innerHTML = `
      <div class="spotify-state" data-spotify-state>
        <strong>RECORD PLAYER // CONNECTING</strong><br>Checking the most recent Spotify listening signal…
      </div>
      <p class="spotify-privacy-note">When connected, this publishes the most recent track from Shaurya's Spotify listening history to anyone who visits this page.</p>`;

    const state = $("[data-spotify-state]", stage);
    const endpoint = interest.spotifyEndpoint || "/api/spotify-recent";

    // Spotify requires its official mark alongside Spotify-provided metadata.
    // The user must download the official black full logo and save it at the
    // path below before enabling the live integration. See README.md.
    const logoPath = "assets/spotify-full-logo.svg";
    const logoReady = await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = logoPath;
    });

    if (!logoReady) {
      state.innerHTML = `<strong>SPOTIFY SETUP PENDING</strong><br>Add the official Spotify full logo as <code>assets/spotify-full-logo.svg</code>, then configure the serverless API credentials described in README.md.`;
      return;
    }

    try {
      const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Spotify endpoint returned ${response.status}`);
      if (!payload.track) throw new Error("No recently played track was returned yet.");

      const track = payload.track;
      const played = track.playedAt ? new Date(track.playedAt) : null;
      const playedLabel = played && !Number.isNaN(played.valueOf())
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(played)
        : "Recently";

      stage.innerHTML = `
        <div class="spotify-player">
          <div class="spotify-art-wrap">
            <img class="spotify-art" src="${escapeHTML(track.artwork || "")}" alt="Album artwork for ${escapeHTML(track.album || track.name)}">
          </div>
          <div class="spotify-meta">
            <p class="eyebrow">LAST RECEIVED // ${escapeHTML(playedLabel)}</p>
            <h4 class="spotify-track">${escapeHTML(track.name)}</h4>
            <p class="spotify-artist">${escapeHTML((track.artists || []).join(", "))}</p>
            <p class="spotify-album">${escapeHTML(track.album || "")}</p>
            <div class="spotify-attribution">
              <img class="spotify-logo" src="${logoPath}" alt="Spotify">
              <a class="button button--small spotify-open" href="${escapeHTML(track.spotifyUrl)}" target="_blank" rel="noreferrer">LISTEN ON SPOTIFY ↗</a>
            </div>
          </div>
        </div>
        <p class="spotify-privacy-note">Metadata and artwork supplied by Spotify. Album artwork is displayed unmodified and links back to the track on Spotify.</p>`;
    } catch (error) {
      state.innerHTML = `<strong>SPOTIFY SIGNAL OFFLINE</strong><br>${escapeHTML(error.message)}<br><span class="muted">If you have not configured it yet, follow the Spotify setup section in README.md.</span>`;
    }
  }

  function buildSketch(stage) {
    stage.classList.add("sketch-stage");
    stage.innerHTML = `<canvas class="sketch-canvas" aria-label="Interactive drawing canvas"></canvas><div class="sketch-toolbar"><button type="button" class="demo-button" data-clear-sketch>CLEAR</button></div>`;
    const canvas = $("canvas", stage);
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let last = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Save the current image when practical so resizing does not always erase it.
      const snapshot = canvas.width && canvas.height ? canvas.toDataURL() : null;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.scale(dpr, dpr);
      if (snapshot) {
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = snapshot;
      }
    };

    const point = event => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const start = event => { drawing = true; last = point(event); canvas.setPointerCapture?.(event.pointerId); };
    const draw = event => {
      if (!drawing) return;
      const next = point(event);
      ctx.strokeStyle = "#403b33";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      last = next;
    };
    const end = () => { drawing = false; last = null; };

    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    $("[data-clear-sketch]", stage).addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
    requestAnimationFrame(resize);
  }

  function buildTV(stage, channels) {
    stage.classList.add("tv-stage");
    const safeChannels = channels.length ? channels : ["CHANNEL 01"];
    let channel = 0;
    stage.innerHTML = `<div><div class="tv-screen"><div><span class="eyebrow">CH 01</span><br><strong>${escapeHTML(safeChannels[0])}</strong></div></div><div class="tv-controls"><button class="demo-button" type="button" data-tv-prev>◀ PREV</button><button class="demo-button" type="button" data-tv-next>NEXT ▶</button></div></div>`;
    const update = () => {
      $(".tv-screen", stage).innerHTML = `<div><span class="eyebrow">CH ${String(channel + 1).padStart(2, "0")}</span><br><strong>${escapeHTML(safeChannels[channel])}</strong></div>`;
    };
    $("[data-tv-prev]", stage).addEventListener("click", () => { channel = (channel - 1 + safeChannels.length) % safeChannels.length; update(); });
    $("[data-tv-next]", stage).addEventListener("click", () => { channel = (channel + 1) % safeChannels.length; update(); });
  }

  // ---------- Contact form validation and mailto handoff ----------
  function initContactForm() {
    const form = $("#contactForm");
    const log = $("#transmissionLog");
    if (!form) return;

    const fields = [$("#contactName"), $("#contactEmail"), $("#contactMessage")];
    const messageFor = field => {
      if (field.validity.valueMissing) return "This field is required.";
      if (field.validity.typeMismatch) return "Enter a valid email address.";
      if (field.validity.tooShort) return `Please use at least ${field.minLength} characters.`;
      return "";
    };
    const validate = field => {
      const message = messageFor(field);
      field.setAttribute("aria-invalid", String(Boolean(message)));
      const error = $(`[data-error-for="${field.id}"]`, form);
      if (error) error.textContent = message;
      return !message;
    };

    fields.forEach(field => {
      field.addEventListener("blur", () => validate(field));
      field.addEventListener("input", () => { if (field.getAttribute("aria-invalid") === "true") validate(field); });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const valid = fields.map(validate).every(Boolean);
      if (!valid) {
        log.textContent = "FORM ERROR // CHECK THE FIELDS ABOVE";
        fields.find(field => field.getAttribute("aria-invalid") === "true")?.focus();
        return;
      }

      log.textContent = "MESSAGE READY // OPENING YOUR MAIL APP…";
      const subject = encodeURIComponent(`Signal Lab message from ${$("#contactName").value.trim()}`);
      const body = encodeURIComponent(`${$("#contactMessage").value.trim()}\n\nFrom: ${$("#contactName").value.trim()}\nEmail: ${$("#contactEmail").value.trim()}`);
      window.location.href = `mailto:${DATA.contacts[0].value}?subject=${subject}&body=${body}`;
    });
  }

  // Initialize in a deliberate order: render first, then bind behavior to the new DOM.
  renderStaticContent();
  initBootSequence();
  initNavigation();
  initRevealAnimations();
  initSignalRail();
  initOscilloscope();
  initSkillConnections();
  initVMDemo();
  initI2CDemo();
  initTuner();
  initContactForm();
})();
