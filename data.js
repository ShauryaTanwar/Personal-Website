/*
  SIGNAL LAB — EDITABLE PORTFOLIO CONTENT
  ----------------------------------------
  Most text, links, skills, projects, experience, and interests live
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
    // ABOUT ME EDITING: Change this one-line note or replace it with whatever you are currently interested in.
    curiosity: "How do I get my hands on a Raspberry Pi?",

    // ABOUT ME EDITING: Each quoted line below becomes its own paragraph on the site.
    // Add/remove paragraphs freely; keep commas between entries.
    bio: [
      "I'm an Electrical and Computer Engineering student at Carnegie Mellon University who enjoys working where software and physical systems meet.",
      "I like understanding how things work from both ends, whether that's writing systems code, debugging embedded hardware, or building interfaces that make complicated information easier to understand.",
      "Outside engineering, you'll usually find me playing tennis, drawing, watching TV, or listening to music."
    ],
    resume: "assets/Shaurya_Tanwar_Resume.pdf",
    // ABOUT ME EDITING: These appear under the "Quick Notes" heading.
    // Change the label/value pairs or add/remove rows as needed.
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
    { label: "Coursework", target: "coursework", channel: "04" },
    { label: "Interests", target: "interests", channel: "05" },
    { label: "Contact", target: "contact", channel: "06" }
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

  /*
    RELEVANT COURSEWORK
    -------------------
    Summaries are original paraphrases based on official CMU course descriptions.
    Keep these short and personal-site friendly rather than copying catalog text.
    Source URLs are retained here for attribution/maintenance, but are not shown
    inside the expandable cards.
  */
  coursework: [
    {
      code: "15-213",
      title: "Introduction to Computer Systems",
      summary: "A programmer-focused look at how computer systems execute programs, store and move data, and communicate. The course connects low-level machine code and memory organization with performance, networking, concurrency, and the systems concepts behind reliable software.",
      source: "https://csd.cs.cmu.edu/15213-introduction-to-computer-systems"
    },
    {
      code: "15-122",
      title: "Principles of Imperative Computation",
      summary: "An introduction to deliberate imperative programming with an emphasis on writing code that is correct by design. The course develops core data structures and algorithms, program reasoning, complexity and memory concepts, and transitions from the C0 teaching language into C.",
      source: "https://csd.cs.cmu.edu/15122-principles-of-imperative-computation"
    },
    {
      code: "18-100",
      title: "Introduction to Electrical & Computer Engineering",
      summary: "A broad introduction to electrical and computer engineering that connects circuits, digital logic, computer architecture, signals, communications, networking, storage, security, and modern computing systems. Hands-on labs reinforce the ideas through practical hardware and system experiments.",
      source: "https://courses.apps.ece.cmu.edu/18100"
    },
    {
      code: "18-220",
      title: "Electronic Devices and Analog Circuits",
      summary: "Develops the foundations of analog electronics through semiconductor devices, DC circuit analysis, operational amplifiers, energy-storage elements, sinusoidal and frequency-domain behavior, filters, and transient response. Laboratory work emphasizes using electronic instrumentation to build, measure, and debug practical circuits involving sensors, amplifiers, filters, signal processing, and power conversion.",
      source: "https://courses.apps.ece.cmu.edu/18220"
    },
    {
      code: "21-259",
      title: "Calculus in Three Dimensions",
      summary: "Extends single-variable calculus into multivariable and vector settings. The course develops three-dimensional geometry, partial derivatives and gradients, optimization, multiple integrals, vector fields, and line and surface integrals that connect differentiation and integration in higher dimensions.",
      source: "https://www.math.cmu.edu/~handron/21_259/index.html"
    },
    {
      code: "33-141",
      title: "Physics I for Engineering Students",
      summary: "A calculus-based introduction to mechanics and thermodynamics. It builds from motion and Newton's laws through energy, momentum, rotation and gravitation, then develops temperature, heat, thermodynamic processes, and the laws governing energy transfer in physical systems.",
      source: "https://coursecatalog.web.cmu.edu/schools-colleges/melloncollegeofscience/departmentofphysics/courses/"
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
      source: "https://github.com/ShauryaTanwar/Personal-Website",
      sourceLabel: "GitHub Link",
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
      description: "This lab bay is reserved for my next project!",
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
      description: "I'm almost always listening to something. This receiver shows the most recent track Spotify reports from my account; it updates through a private GitHub Actions workflow, not from secret credentials in your browser.",
      interactive: "music"
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
      title: "TV & Movies",
      code: "VIDEO SIGNAL",
      // TV / MOVIE EDITING:
      // Add, remove, or reorder entries in `media` to change the carousel.
      // `image` can be a local path such as "assets/tv/my-poster.jpg" or a remote image URL.
      // `source` is where the cover opens if a visitor clicks it.
      description: "A few shows and movies I keep coming back to. Flip through the covers below to see some favorites.",
      interactive: "tv",
      media: [
        {
          title: "How I Met Your Mother",
          type: "TV SERIES",
          image: "https://m.media-amazon.com/images/M/MV5BNjg1MDQ5MjQ2N15BMl5BanBnXkFtZTYwNjI5NjA3._V1_.jpg",
          source: "https://en.wikipedia.org/wiki/How_I_Met_Your_Mother",
          alt: "How I Met Your Mother cover"
        },
        {
          title: "Fullmetal Alchemist: Brotherhood",
          type: "TV SERIES",
          image: "https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg",
          source: "https://en.wikipedia.org/wiki/Fullmetal_Alchemist:_Brotherhood",
          alt: "Fullmetal Alchemist: Brotherhood cover"
        },
        {
          title: "The Creator",
          type: "MOVIE",
          image: "https://m.media-amazon.com/images/M/MV5BNDUyNTIzNDQtYTZmMi00M2FlLTgyZjUtYWViZWNhMDYzMjE4XkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg",
          source: "https://en.wikipedia.org/wiki/The_Creator_(2023_film)",
          alt: "The Creator movie cover"
        },
        {
          title: "Taare Zameen Par",
          type: "MOVIE",
          image: "https://m.media-amazon.com/images/M/MV5BMDhjZWViN2MtNzgxOS00NmI4LThiZDQtZDI3MzM4MDE4NTc0XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
          source: "https://en.wikipedia.org/wiki/Taare_Zameen_Par",
          alt: "Taare Zameen Par movie cover"
        }
      ]
    }
  ],
};

