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
    $("#heroSchool").textContent = `${DATA.person.school}`;
    $("#heroLine").textContent = DATA.person.tagline;
    $("#resumeLink").href = DATA.person.resume;

    $("#siteNav").innerHTML = DATA.navigation.map(item =>
      `<a href="#${escapeHTML(item.target)}" data-nav-target="${escapeHTML(item.target)}"><span>${escapeHTML(item.channel)}</span> ${escapeHTML(item.label)}</a>`
    ).join("");

    $("#bioCopy").innerHTML = DATA.person.bio.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("");
    $("#currentCuriosity").textContent = DATA.person.curiosity;
    const aboutFacts = $("#aboutFacts");
    if (aboutFacts && Array.isArray(DATA.person.facts)) {
      aboutFacts.innerHTML = DATA.person.facts.map(fact => `<div><span>${escapeHTML(fact.label)}</span><strong>${escapeHTML(fact.value)}</strong></div>`).join("");
    }

    $("#interestPreview").innerHTML = DATA.interests.map(interest => `
      <a class="interest-mini" href="#interests" data-preview-interest="${escapeHTML(interest.id)}">
        <strong>${escapeHTML(interest.title)}</strong>
        <span>${escapeHTML(interest.frequency.toFixed(1))} MHz</span>
      </a>
    `).join("");

    renderSkills();
    renderCoursework();
    renderProjects();
    renderExperience();
    renderContactLinks();
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

  function renderCoursework() {
    const list = $("#courseworkList");
    if (!list || !Array.isArray(DATA.coursework)) return;

    // Native <details>/<summary> keeps the accordion usable with mouse,
    // touch, and keyboard even if the rest of the JavaScript is disabled.
    list.innerHTML = DATA.coursework.map((course, index) => `
      <details class="course-card">
        <summary class="course-summary">
          <span class="course-number">${escapeHTML(course.code)}</span>
          <span class="course-title">${escapeHTML(course.title)}</span>
          <span class="course-toggle" aria-hidden="true"></span>
        </summary>
        <div class="course-details">
          <p>${escapeHTML(course.summary)}</p>
        </div>
      </details>
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
        <article class="project-card instrument-panel reveal" data-project-id="${escapeHTML(project.id)}" data-work-card>
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
      <article class="timeline-entry reveal" data-experience-id="${escapeHTML(entry.id || "")}">
        <div class="timeline-date">${escapeHTML(entry.date)}</div>
        <div class="timeline-card instrument-panel" data-work-card>
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


  // ---------- Power-on experience ----------
  function initBootSequence() {
    const boot = $("#bootScreen");
    const powerSwitch = $("#powerSwitch");
    const skip = $("#skipBoot");
    const log = $("#bootLog");
    const bootTitle = $("#bootTitle");

    if (!boot || !powerSwitch || !skip || !log || !bootTitle) return;

    const STORAGE_KEY = "signalLabBootSeen";
    const forceBoot = new URLSearchParams(window.location.search).get("boot") === "1";

    // Remember a visitor only after they actually press the POWER switch.
    // If localStorage is unavailable, the site simply falls back to showing
    // the sequence again on the next visit.
    let hasPoweredOnBefore = false;
    try {
      hasPoweredOnBefore = localStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      console.warn("Signal Lab could not read the saved power state.", error);
    }

    // Returning visitors skip the overlay automatically. Add ?boot=1 to the
    // URL whenever you want to preview/test the sequence again without
    // deleting the visitor's saved preference.
    if (hasPoweredOnBefore && !forceBoot) {
      boot.classList.add("is-hidden");
      boot.setAttribute("aria-hidden", "true");
      return;
    }

    boot.classList.remove("is-hidden", "is-powered");
    boot.removeAttribute("aria-hidden");
    powerSwitch.setAttribute("aria-pressed", "false");
    bootTitle.textContent = "POWER OFF";
    log.replaceChildren();

    const finish = () => {
      boot.classList.add("is-hidden");
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

      // Save the preference at the moment the visitor deliberately powers on.
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (error) {
        console.warn("Signal Lab could not save the power state.", error);
      }

      boot.classList.add("is-powered");
      powerSwitch.setAttribute("aria-pressed", "true");
      bootTitle.textContent = "WARMING UP";

      if (reducedMotion.matches) {
        log.innerHTML = bootMessages.map(([left, right]) => `<span>${left}<strong>${right}</strong></span>`).join("");
        bootTitle.textContent = "READY";
        setTimeout(finish, 120);
        return;
      }

      bootMessages.forEach(([left, right], index) => {
        setTimeout(() => {
          const row = document.createElement("span");
          row.innerHTML = `${escapeHTML(left)}<strong>${escapeHTML(right)}</strong>`;
          log.append(row);
          if (index === bootMessages.length - 1) {
            bootTitle.textContent = "READY";
            setTimeout(finish, 550);
          }
        }, 190 * (index + 1));
      });
    };

    powerSwitch.addEventListener("click", run);

    // Skipping does NOT mark the sequence as seen. If a visitor skips it,
    // they'll still get the option to power on during their next visit.
    skip.addEventListener("click", finish);
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

  // ---------- Skills highlight linked projects + experience ----------
  function initSkillConnections() {
    const chips = $$(".skill-chip[data-projects]");
    const status = $("#skillRelationStatus");
    const projectCards = $$(".project-card[data-project-id]");
    const experienceEntries = $$(".timeline-entry[data-experience-id]");
    const allWork = [...projectCards, ...experienceEntries];
    let selectedChip = null;

    const workId = element => element.dataset.projectId || element.dataset.experienceId || "";
    const workTitle = element => {
      if (element.dataset.projectId) return $("h3", element)?.textContent?.trim() || element.dataset.projectId;
      return $("h3", element)?.textContent?.trim() || element.dataset.experienceId;
    };

    const clearHighlight = () => {
      allWork.forEach(item => item.classList.remove("is-highlighted", "is-dimmed"));
    };

    const targetsFor = chip => (chip?.dataset.projects || "").split(/\s+/).filter(Boolean);

    const highlight = chip => {
      const targets = targetsFor(chip);
      if (!targets.length) {
        clearHighlight();
        return;
      }
      allWork.forEach(item => {
        const match = targets.includes(workId(item));
        item.classList.toggle("is-highlighted", match);
        item.classList.toggle("is-dimmed", !match);
      });
    };

    const renderStatus = chip => {
      if (!status) return;
      const targets = targetsFor(chip);
      const matches = allWork.filter(item => targets.includes(workId(item)));
      if (!chip || !matches.length) {
        status.textContent = "Choose a skill to see the related work.";
        return;
      }
      const links = matches.map(item => {
        const id = workId(item);
        return `<a href="#${escapeHTML(id)}" class="skill-work-link" data-skill-work-target="${escapeHTML(id)}">${escapeHTML(workTitle(item))} ↘</a>`;
      }).join("");
      status.innerHTML = `<span><strong>${escapeHTML(chip.textContent.trim())}</strong> appears in:</span><span class="skill-work-links">${links}</span>`;
    };

    const selectChip = chip => {
      if (selectedChip === chip) {
        chip.classList.remove("is-selected");
        chip.setAttribute("aria-pressed", "false");
        selectedChip = null;
        clearHighlight();
        renderStatus(null);
        return;
      }
      if (selectedChip) {
        selectedChip.classList.remove("is-selected");
        selectedChip.setAttribute("aria-pressed", "false");
      }
      selectedChip = chip;
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      highlight(chip);
      renderStatus(chip);
    };

    chips.forEach(chip => {
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", () => selectChip(chip));
      chip.addEventListener("mouseenter", () => { if (!selectedChip) highlight(chip); });
      chip.addEventListener("mouseleave", () => { if (!selectedChip) clearHighlight(); });
      chip.addEventListener("focus", () => { if (!selectedChip) highlight(chip); });
      // Intentionally do NOT redraw on blur. Redrawing here used to replace a
      // related-work link while it was being clicked, forcing a second click.
      chip.addEventListener("blur", () => { if (!selectedChip) clearHighlight(); });
    });

    // Use delegated navigation so the first click always works, even though the
    // related links are dynamically rendered after a skill is selected.
    status?.addEventListener("click", event => {
      const link = event.target.closest("[data-skill-work-target]");
      if (!link) return;
      const targetId = link.dataset.skillWorkTarget;
      const target = projectCards.find(card => card.dataset.projectId === targetId)
        || experienceEntries.find(entry => entry.dataset.experienceId === targetId);
      if (!target) return;
      event.preventDefault();
      target.id = target.id || targetId;
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
      history.replaceState(null, "", `#${targetId}`);
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
    if (interest.interactive === "music") buildMusic(stage);
    if (interest.interactive === "drawing") buildSketch(stage);
    if (interest.interactive === "tv") buildTV(stage, interest.media || interest.channels || []);
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

  function buildMusic(stage) {
    /*
      SPOTIFY RECENTLY PLAYED RECEIVER
      --------------------------------
      GitHub Pages cannot keep secrets or call Spotify with a client secret.
      A scheduled GitHub Action writes the safe public snapshot in
      spotify-recent.json. This browser code only reads that public file.
    */
    stage.classList.add("spotify-stage");
    stage.innerHTML = `
      <div class="spotify-receiver" aria-live="polite">
        <div class="spotify-receiver__topline">
          <span>RECENT PLAYBACK // GITHUB PAGES FEED</span>
          <span class="spotify-receiver__lamp" aria-hidden="true"></span>
        </div>
        <div class="spotify-receiver__body">
          <div class="spotify-artwork-wrap">
            <a data-spotify-art-link href="https://open.spotify.com/" target="_blank" rel="noreferrer" aria-label="Open track on Spotify">
              <div class="spotify-artwork-placeholder" data-spotify-art-placeholder aria-hidden="true">
                <span>WAITING FOR PLAYBACK…</span>
              </div>
              <img data-spotify-artwork alt="" hidden />
            </a>
          </div>
          <div class="spotify-track-info">
            <p class="spotify-kicker">LAST HEARD</p>
            <h4 data-spotify-track>Waiting for Spotify data…</h4>
            <p class="spotify-artist" data-spotify-artist>Run the GitHub Pages workflow after adding your secrets.</p>
            <p class="spotify-album" data-spotify-album></p>
            <p class="spotify-played" data-spotify-played></p>
            <a class="button button--small spotify-open" data-spotify-link href="https://open.spotify.com/" target="_blank" rel="noreferrer" hidden>LISTEN ON SPOTIFY ↗</a>
          </div>
        </div>
        <div class="spotify-brand-row">
          <img class="spotify-brand-logo" data-spotify-logo src="assets/spotify-full-logo.png" alt="Spotify" hidden />
          <span data-spotify-logo-note>Spotify attribution logo: add assets/spotify-full-logo.png from Spotify's official brand assets.</span>
        </div>
        <p class="spotify-status" data-spotify-status>Checking spotify-recent.json…</p>
      </div>`;

    const trackEl = $("[data-spotify-track]", stage);
    const artistEl = $("[data-spotify-artist]", stage);
    const albumEl = $("[data-spotify-album]", stage);
    const playedEl = $("[data-spotify-played]", stage);
    const statusEl = $("[data-spotify-status]", stage);
    const artwork = $("[data-spotify-artwork]", stage);
    const artworkPlaceholder = $("[data-spotify-art-placeholder]", stage);
    const artLink = $("[data-spotify-art-link]", stage);
    const spotifyLink = $("[data-spotify-link]", stage);
    const logo = $("[data-spotify-logo]", stage);
    const logoNote = $("[data-spotify-logo-note]", stage);

    // Spotify requires its metadata/artwork to be attributed with its logo.
    // The logo itself is not bundled here; download the official full logo and
    // save it as assets/spotify-full-logo.png. Until then the receiver still
    // explains how to finish setup but does not show Spotify metadata.
    let logoReady = false;
    const markLogoReady = () => {
      logoReady = true;
      logo.hidden = false;
      if (logoNote) logoNote.hidden = true;
    };
    logo.addEventListener("load", markLogoReady, { once: true });
    logo.addEventListener("error", () => {
      logoReady = false;
      logo.hidden = true;
      if (logoNote) logoNote.hidden = false;
    }, { once: true });
    if (logo.complete && logo.naturalWidth > 0) markLogoReady();

    const formatPlayedAt = value => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return `Played ${new Intl.DateTimeFormat(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
      }).format(date)}`;
    };

    const showMessage = (title, body, status) => {
      trackEl.textContent = title;
      artistEl.textContent = body;
      albumEl.textContent = "";
      playedEl.textContent = "";
      statusEl.textContent = status;
      artwork.hidden = true;
      artworkPlaceholder.hidden = false;
      spotifyLink.hidden = true;
    };

    const load = async () => {
      try {
        const response = await fetch(`./spotify-recent.json?ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.status === "not_configured") {
          showMessage("Spotify isn't connected yet.", "Add the three repository secrets, then run the Pages workflow.", "RECEIVER // NOT CONFIGURED");
          return;
        }
        if (data.status === "reauthorization_required") {
          showMessage("Spotify needs authorization again.", "Generate a fresh refresh token and update SPOTIFY_REFRESH_TOKEN in GitHub.", "RECEIVER // REAUTHORIZE");
          return;
        }
        if (data.status !== "ok" || !data.track) {
          showMessage("No recent track available.", data.message || "Spotify did not return a recent track.", "RECEIVER // STANDBY");
          return;
        }
        if (!logoReady) {
          showMessage("Spotify data is ready.", "Add the official full Spotify logo at assets/spotify-full-logo.png to display the track with required attribution.", "RECEIVER // ADD ATTRIBUTION LOGO");
          return;
        }

        const track = data.track;
        const url = track.spotifyUrl || "https://open.spotify.com/";
        trackEl.textContent = track.name || "Unknown track";
        artistEl.textContent = Array.isArray(track.artists) && track.artists.length ? track.artists.join(", ") : "Unknown artist";
        albumEl.textContent = track.album ? `Album: ${track.album}` : "";
        playedEl.textContent = formatPlayedAt(track.playedAt);
        statusEl.textContent = data.updatedAt ? `SNAPSHOT UPDATED // ${formatPlayedAt(data.updatedAt).replace(/^Played /, "")}` : "RECEIVER // ONLINE";
        spotifyLink.href = url;
        spotifyLink.hidden = false;
        artLink.href = url;

        if (track.artwork) {
          artwork.src = track.artwork;
          artwork.alt = `Album artwork for ${track.album || track.name || "recent Spotify track"}`;
          artwork.onload = () => {
            artwork.hidden = false;
            artworkPlaceholder.hidden = true;
          };
          artwork.onerror = () => {
            artwork.hidden = true;
            artworkPlaceholder.hidden = false;
          };
        }
      } catch (error) {
        console.error("Signal Lab Spotify receiver:", error);
        showMessage("Spotify receiver offline.", "The public spotify-recent.json file could not be loaded.", "RECEIVER // OFFLINE");
      }
    };

    load();
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

  function buildTV(stage, mediaItems) {
    /*
      RETRO TV / MOVIE CAROUSEL
      -------------------------
      The data for this section lives in data.js under the TV interest.
      Each item can contain: title, type, image, source, and alt.

      This function also supports the old array-of-strings format so older
      data does not break while you are editing the site.
    */
    stage.classList.add("tv-stage");

    const normalized = (Array.isArray(mediaItems) && mediaItems.length ? mediaItems : ["CHANNEL 01"])
      .map((item, index) => typeof item === "string"
        ? {
            title: item,
            type: "FAVORITE",
            image: "",
            source: "",
            alt: `${item} cover`
          }
        : {
            title: item.title || `CHANNEL ${String(index + 1).padStart(2, "0")}`,
            type: item.type || "FAVORITE",
            image: item.image || "",
            source: item.source || "",
            alt: item.alt || `${item.title || "Media"} cover`
          });

    let current = 0;

    stage.innerHTML = `
      <div class="tv-carousel">
        <div class="tv-heading" aria-live="polite">
          <div class="tv-heading-row">
            <span class="eyebrow" data-tv-type></span>
            <span class="tv-counter" data-tv-counter></span>
          </div>
          <h4 data-tv-title></h4>
        </div>

        <a class="tv-poster-link" data-tv-poster-link target="_blank" rel="noopener noreferrer">
          <div class="tv-poster-frame">
            <img class="tv-poster" data-tv-poster alt="" loading="lazy" referrerpolicy="no-referrer">
            <div class="tv-poster-fallback" data-tv-fallback hidden>
              <span>IMAGE UNAVAILABLE</span>
            </div>
          </div>
        </a>

        <div class="tv-controls" aria-label="TV and movie carousel controls">
          <button class="demo-button" type="button" data-tv-prev aria-label="Previous favorite">◀ PREV</button>
          <div class="tv-dots" data-tv-dots aria-label="Choose a favorite"></div>
          <button class="demo-button" type="button" data-tv-next aria-label="Next favorite">NEXT ▶</button>
        </div>
      </div>
    `;

    const title = $("[data-tv-title]", stage);
    const type = $("[data-tv-type]", stage);
    const counter = $("[data-tv-counter]", stage);
    const poster = $("[data-tv-poster]", stage);
    const posterLink = $("[data-tv-poster-link]", stage);
    const fallback = $("[data-tv-fallback]", stage);
    const dots = $("[data-tv-dots]", stage);

    dots.innerHTML = normalized.map((item, index) => `
      <button
        class="tv-dot"
        type="button"
        data-tv-index="${index}"
        aria-label="Show ${escapeHTML(item.title)}"
        aria-pressed="false"
      >${String(index + 1).padStart(2, "0")}</button>
    `).join("");

    const update = () => {
      const item = normalized[current];
      title.textContent = item.title;
      type.textContent = item.type;
      counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(normalized.length).padStart(2, "0")}`;

      poster.alt = item.alt;
      poster.hidden = !item.image;
      fallback.hidden = Boolean(item.image);

      if (item.image) {
        poster.src = item.image;
      } else {
        poster.removeAttribute("src");
      }

      if (item.source) {
        posterLink.href = item.source;
        posterLink.removeAttribute("aria-disabled");
        posterLink.tabIndex = 0;
      } else {
        posterLink.removeAttribute("href");
        posterLink.setAttribute("aria-disabled", "true");
        posterLink.tabIndex = -1;
      }

      $$("[data-tv-index]", dots).forEach((button, index) => {
        button.classList.toggle("is-active", index === current);
        button.setAttribute("aria-pressed", String(index === current));
      });
    };

    poster.addEventListener("error", () => {
      poster.hidden = true;
      fallback.hidden = false;
    });

    poster.addEventListener("load", () => {
      poster.hidden = false;
      fallback.hidden = true;
    });

    $("[data-tv-prev]", stage).addEventListener("click", () => {
      current = (current - 1 + normalized.length) % normalized.length;
      update();
    });

    $("[data-tv-next]", stage).addEventListener("click", () => {
      current = (current + 1) % normalized.length;
      update();
    });

    dots.addEventListener("click", event => {
      const button = event.target.closest("[data-tv-index]");
      if (!button) return;
      current = Number(button.dataset.tvIndex);
      update();
    });

    update();
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
