/*
  SIGNAL LAB — EDITABLE PORTFOLIO CONTENT
  ----------------------------------------
  Most text, links, skills, projects, experience, interests, and credits live
  in this file so you can update the site without searching through app.js.

  Search for "TODO:" before publishing. Those comments mark information that
  you should personalize (photo, project repository URLs, favorite shows, etc.).
*/

window.PORTFOLIO_DATA = {
  person: {
    name: "Shaurya Tanwar",
    role: "Electrical & Computer Engineering",
    school: "Carnegie Mellon University",
    graduation: "May 2029",
    location: "Pittsburgh, PA",
    tagline: "Building systems where software meets hardware.",
    curiosity: "Building things that feel as good to use as they are interesting to engineer.",
    bio: [
      "I'm Shaurya, an Electrical and Computer Engineering student at Carnegie Mellon University who enjoys working where software and physical systems meet.",
      "I like understanding how things work from both ends—whether that's writing systems code, debugging embedded hardware, or building interfaces that make complicated information easier to understand.",
      "Outside engineering, you'll usually find me playing tennis, drawing, watching TV, or listening to music."
    ],
    resume: "assets/Shaurya_Tanwar_Resume.pdf",
    facts: [
      { label: "Degree", value: "B.S. Electrical & Computer Engineering" },
      { label: "Expected Graduation", value: "May 2029" },
      { label: "GPA", value: "3.50 / 4.00" },
      { label: "Honors", value: "Eagle Scout // Gold Presidential Volunteer Service Award" }
    ]
  },

  navigation: [
    { label: "About", target: "about", channel: "01" },
    { label: "Projects", target: "projects", channel: "02" },
    { label: "Experience", target: "experience", channel: "03" },
    { label: "Interests", target: "interests", channel: "04" },
    { label: "Contact", target: "contact", channel: "05" }
  ],

  contacts: [
    {
      label: "Email",
      value: "shauryatanwar7@gmail.com",
      href: "mailto:shauryatanwar7@gmail.com",
      code: "MAIL"
    },
    {
      label: "GitHub",
      value: "github.com/ShauryaTanwar",
      href: "https://github.com/ShauryaTanwar",
      code: "GIT"
    },
    {
      label: "LinkedIn",
      value: "linkedin.com/in/shaurya-tanwar",
      href: "https://www.linkedin.com/in/shaurya-tanwar",
      code: "IN"
    }
  ],

  skills: [
    {
      category: "Languages",
      items: [
        { name: "Python", projects: ["signal-lab", "uvd-dashboard"] },
        { name: "C", projects: ["c0vm", "embedded"] },
        { name: "C++", projects: [] },
        { name: "Java", projects: ["scout-tracker", "superwit"] },
        { name: "JavaScript", projects: ["signal-lab", "superwit"] },
        { name: "SQL", projects: ["uvd-dashboard"] }
      ]
    },
    {
      category: "Frameworks / Libraries",
      items: [
        { name: "React", projects: ["uvd-dashboard"] },
        { name: "Next.js", projects: ["superwit"] },
        { name: "Node.js", projects: ["signal-lab"] },
        { name: "Android SDK", projects: ["scout-tracker"] }
      ]
    },
    {
      category: "Tools / Platforms",
      items: [
        { name: "Git", projects: ["signal-lab", "c0vm", "scout-tracker"] },
        { name: "Linux", projects: ["uvd-dashboard"] },
        { name: "AWS", projects: [] },
        { name: "Microsoft Azure", projects: ["uvd-dashboard"] }
      ]
    },
    {
      category: "Hardware / Lab",
      items: [
        { name: "I2C", projects: ["embedded"] },
        { name: "Oscilloscopes", projects: ["embedded"] },
        { name: "Logic Analyzers", projects: ["embedded"] },
        { name: "Multimeters", projects: ["embedded"] },
        { name: "Soldering", projects: ["embedded"] },
        { name: "Circuit Prototyping", projects: ["embedded"] }
      ]
    }
  ],

  projects: [
    {
      id: "signal-lab",
      title: "Signal Lab Portfolio",
      status: "ACTIVE",
      type: "portfolio",
      eyebrow: "EXPERIMENT ST-01",
      image: "assets/signal-lab-screenshot.svg",
      imageAlt: "Retro-styled preview of the Signal Lab portfolio interface",
      description: "An interactive personal portfolio inspired by old electronics benches, printed lab manuals, and classic personal websites. It combines a playable tennis game, oscilloscope, radio tuner, code demos, responsive layouts, and accessible vanilla JavaScript interactions.",
      technologies: ["HTML", "CSS", "JavaScript", "Canvas API"],
      demo: "#home",
      // TODO: Replace this with the URL of the repository for THIS portfolio.
      source: "https://github.com/ShauryaTanwar",
      sourceLabel: "GitHub profile — add repo URL",
      note: "RECURSIVE SYSTEM DETECTED"
    },
    {
      id: "c0vm",
      title: "C0VM Bytecode Interpreter",
      status: "COMPLETE",
      type: "c0vm",
      eyebrow: "EXPERIMENT ST-02",
      image: "assets/c0vm-architecture.svg",
      imageAlt: "Diagram showing instructions moving through a stack-based virtual machine",
      description: "Implemented a C0VM bytecode interpreter in C with stack- and heap-based runtime structures for functions, pointers, arrays, control flow, memory operations, and library calls. Built call frames and low-level memory handling while using Valgrind to eliminate memory errors.",
      technologies: ["C", "Valgrind", "Stacks", "Heaps"],
      demo: null,
      // CMU course code may have sharing restrictions. Add a link only if permitted.
      source: null,
      sourceLabel: "Source private / course work",
      note: "INTERACTIVE STACK DEMO BELOW"
    },
    {
      id: "scout-tracker",
      title: "Scout Tracker",
      status: "COMPLETE",
      type: "standard",
      eyebrow: "EXPERIMENT ST-03",
      image: "assets/scout-tracker-placeholder.svg",
      imageAlt: "Mock mobile interface for the Scout Tracker Android application",
      description: "A Java Android application designed and developed independently over 200+ hours. It centralizes long-term advancement records with persistent tracking for 125+ rank requirements, 21 merit badges, completion dates, and camping and hiking activity.",
      technologies: ["Java", "Android SDK", "UI Design", "Data Modeling"],
      demo: null,
      // TODO: Add the repository or demo URL if you want to share this project publicly.
      source: null,
      sourceLabel: "Repository not public",
      note: "200+ DEVELOPMENT HOURS"
    },
    {
      id: "embedded",
      title: "Embedded Systems & Circuit Design",
      status: "COMPLETE",
      type: "i2c",
      eyebrow: "EXPERIMENT ST-04",
      image: "assets/embedded-system.svg",
      imageAlt: "Diagram of a microcontroller communicating with a temperature sensor and LCD over I2C",
      description: "Built and debugged a multi-device embedded system using I2C communication between a microcontroller, temperature sensor, LCD, and physical inputs. Also built and soldered an AM radio circuit with a hand-wound ferrite-core inductor and tuned components to receive radio frequencies.",
      technologies: ["C", "I2C", "Logic Analyzer", "Soldering"],
      demo: null,
      source: null,
      sourceLabel: "Hardware project",
      note: "LIVE I2C BUS SIMULATION BELOW"
    },
    {
      id: "future-01",
      title: "Future Signal",
      status: "AWAITING INPUT",
      type: "future",
      eyebrow: "EXPERIMENT SLOT 05",
      image: null,
      imageAlt: "",
      description: "This lab bay is reserved for the next project worth documenting. Replace this placeholder when a new experiment comes online.",
      technologies: ["???"],
      demo: null,
      source: null,
      sourceLabel: null,
      note: "SIGNAL NOT YET DETECTED"
    }
  ],

  experience: [
    {
      id: "uvd-dashboard",
      date: "May 2026 — Aug 2026",
      company: "UltraViolet Devices",
      role: "Engineering Intern",
      location: "Valencia, CA",
      metrics: ["100+ devices secured", "1,000+ daily logs", "150+ field devices", "10 diagnostic conditions"],
      bullets: [
        "Implemented TLS 1.2 encryption for device-to-server communications and deployed the update across 100+ production and field devices.",
        "Built a full-stack React/Python analytics dashboard backed by Azure SQL, processing 1,000+ daily logs from 150+ field devices and integrating OpenAI and Google Gemini APIs for automated reporting and natural-language queries.",
        "Validated GPS and cellular performance across antenna/receiver configurations and operating environments, and conducted thermocouple testing to inform next-generation hardware component selection."
      ],
      visual: "network"
    },
    {
      id: "code-ninjas",
      date: "May 2024 — Aug 2025",
      company: "Code Ninjas",
      role: "Student Instructor / Sensei",
      location: "Valencia, CA",
      metrics: ["20+ students", "150 coaching hours", "30+ campers/session", "5 languages/platforms"],
      bullets: [
        "Taught JavaScript, Python, Java, Scratch, and Lua to students ages 6–17 through 150 hours of coaching.",
        "Led coding and robotics camps for 30+ students per session and helped 15 students advance by at least two proficiency levels."
      ],
      visual: "teaching"
    },
    {
      id: "superwit",
      date: "May 2024 — Aug 2024",
      company: "SuperWIT",
      role: "Intern",
      location: "Simi Valley, CA",
      metrics: ["Production deployment", "Data visualization", "Next.js", "Java + Python"],
      bullets: [
        "Independently developed and deployed production data visualizations for the Leyland Cypress LLC investment firm website using Next.js, Java, and Python."
      ],
      visual: "chart"
    }
  ],

  interests: [
    {
      id: "tennis",
      frequency: 88.1,
      title: "Tennis",
      code: "COURT SIGNAL",
      description: "One of my favorite ways to reset after spending too much time staring at code. Play a short arcade tennis game below: move your racket, serve, and try to win the game before the computer.",
      interactive: "tennis"
    },
    {
      id: "music",
      frequency: 92.7,
      title: "Music",
      code: "AUDIO SIGNAL",
      description: "I'm almost always listening to something. Once Spotify is connected, this receiver shows the most recent track from my listening history.",
      interactive: "music",
      spotifyEndpoint: "/api/spotify-recent"
    },
    {
      id: "drawing",
      frequency: 98.5,
      title: "Drawing",
      code: "ANALOG INPUT",
      description: "Drawing gives me a different kind of problem-solving space. Use the sketch pad to leave a temporary signal of your own.",
      interactive: "drawing"
    },
    {
      id: "tv",
      frequency: 104.3,
      title: "TV",
      code: "VIDEO SIGNAL",
      // TODO: Replace these generic channels with your actual favorite shows or genres.
      description: "A good show is one of my favorite ways to switch modes. Cycle through a few placeholder channels below, then customize them with your favorites.",
      interactive: "tv",
      channels: ["SCI-FI", "COMEDY", "DRAMA", "ANIMATION"]
    }
  ],

  credits: [
    "Design, writing, HTML, CSS, and JavaScript: Shaurya Tanwar / Signal Lab.",
    "No external website template, JavaScript framework, icon library, stock photography, or web font is required by this starter.",
    "Decorative project diagrams and placeholder graphics are original local SVG assets included with this project.",
    "Resume content is adapted from Shaurya Tanwar's own resume.",
    "Spotify metadata and album artwork, when enabled, are supplied by Spotify and link back to Spotify. Use the official Spotify full logo per Spotify's Developer Design Guidelines.",
    "TODO: If you add third-party photos, icons, fonts, text, screenshots, or templates, add the creator, source, and license here before publishing."
  ]
};
