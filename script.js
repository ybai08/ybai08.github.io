// ---------- skill icons (Devicon CDN, with text fallback) ----------
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";

document.querySelectorAll(".skill-grid").forEach((grid) => {
  grid.dataset.skills.split(",").forEach((pair) => {
    const [slug, label] = pair.split(":");
    const li = document.createElement("li");
    li.className = "skill";

    const icon = document.createElement("div");
    icon.className = "skill__icon";
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
      // try the "plain" variant, then fall back to initials
      if (!img.dataset.retried && !slug.startsWith("_")) {
        img.dataset.retried = "1";
        img.src = `${DEVICON}/${slug}/${slug}-plain.svg`;
        return;
      }
      img.remove();
      icon.classList.add("is-fallback");
      icon.textContent = label.replace(/[^A-Za-z+#]/g, "").slice(0, 3);
    };
    icon.appendChild(img);
    // slugs starting with "_" have no Devicon logo: render the text badge
    if (slug.startsWith("_")) img.onerror();
    else img.src = `${DEVICON}/${slug}/${slug}-original.svg`;

    const name = document.createElement("span");
    name.className = "skill__name";
    name.textContent = label;

    li.append(icon, name);
    grid.appendChild(li);
  });
});

// ---------- reveal on scroll ----------
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// let the About icons "draw" themselves (CSS animates stroke-dashoffset 100 -> 0)
document.querySelectorAll(".pillar__icon > *").forEach((el) => el.setAttribute("pathLength", "100"));

const revealTargets = document.querySelectorAll(
  ".boxed, .lead, .pillar, .tl, .skills__label, .skill, .awards li, .card, .form, .showcase__copy > *, .showcase__media, .oss__summary, .oss__list"
);
// stagger siblings (skills, cards, pillars...) so they cascade in
revealTargets.forEach((el) => {
  const i = [...el.parentElement.children].indexOf(el) % 8;
  if (i > 0) {
    el.style.transitionDelay = `${i * 70}ms`;
    // drop the delay once revealed so hover effects stay snappy
    el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
  }
});
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
}

// ---------- hero terminal: plays an intro once, then you can type in it ----------
const term = (() => {
  const box = document.getElementById("terminal");
  if (!box) return null;
  const screen = box.querySelector(".term__screen");
  const input = box.querySelector(".term__input");
  const hint = document.querySelector(".term__hint");

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${esc(text)}</a>`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ----- tiny filesystem (edit freely: plain text, one string per line) -----
  const PROJECTS = {
    spartan: { url: "https://thespartan.app", lines: ["spartan: social fitness app for iOS", "300+ users, 62% week-1 retention", "react native + firebase, built solo over 3+ years"] },
    docket: { url: "https://docketapp.tech", lines: ["docket: mini-games for civics", "built at hacktx 2026; invited by meta to its ai hackathon final", "react native, typescript, postgresql, python"] },
    kaggriculture: { url: "https://www.kaggle.com/competitions/kaggriculture", lines: ["kaggriculture: ai agent for google's farming game", "peaked 39th of 10,192 teams (top 0.4%)", "python agent, tuned on a custom rust simulator"] },
    soup: { url: "https://github.com/MakazhanAlpamys/Soup", lines: ["soup: llm fine-tuning framework (10k stars)", "training lead; 44 merged prs", "cut peak training vram 46%"] },
    surfsense: { url: "https://github.com/MODSetter/SurfSense", lines: ["surfsense: local-ai desktop app (16k stars)", "38 merged prs", "server-pushed updates cut refetches ~7x"] },
  };
  const FILES = {
    "focus.txt": ["web, mobile & backend apps", "ai, ml systems & tooling", "open source"],
    "hobbies.txt": ["chess", "hiking", "protein-folding research"],
    "mysterious-letter.txt": [
      "To Whom it May Concern,",
      "",
      "Although I don't know him that well, I can assure you that Yang is the most handsome, hardworking, diligent, intelligent (did i mention handsome?), SWE in the world.",
      "",
      "- Yango Mango",
    ],
    "phone.txt": null, // built below (tap-to-call link)
    ".secret": ["you found the hidden file. nice digging.", "", "one more: try  sudo hire yang"],
  };
  const PHONE_HTML = ["You've found my phone number!", link("tel:+14694934203", "469-493-4203")];
  const OPENABLE = {
    github: "https://github.com/ybai08",
    linkedin: "https://linkedin.com/in/yangbai2026",
    email: "mailto:yangbai2026@gmail.com",
    ...Object.fromEntries(Object.entries(PROJECTS).map(([k, v]) => [k, v.url])),
  };

  let cwd = "~";
  const listDir = (dir, all) => {
    if (dir === "~") {
      const names = Object.keys(FILES).filter((f) => all || !f.startsWith("."));
      return ["projects/", ...names];
    }
    if (dir === "~/projects") return Object.keys(PROJECTS).map((p) => p + ".md");
    return null;
  };
  const resolve = (p) => {
    if (!p || p === "~") return "~";
    p = p.replace(/\/+$/, "");
    if (p === "..") return "~";
    if (p === ".") return cwd;
    if (p.startsWith("~/")) return p;
    return cwd === "~" ? "~/" + p : cwd + "/" + p;
  };
  const readFile = (path) => {
    const full = resolve(path);
    const m = full.match(/^~\/projects\/([\w-]+?)(\.md)?$/);
    if (m && PROJECTS[m[1]]) return { lines: PROJECTS[m[1]].lines.map(esc).concat(["", "open it: " + esc("open " + m[1])]) };
    const name = full.replace(/^~\//, "");
    if (name === "phone.txt") return { lines: PHONE_HTML };
    if (Object.prototype.hasOwnProperty.call(FILES, name)) return { lines: FILES[name].map(esc) };
    if (full === "~/projects") return { err: `cat: ${esc(path)}: is a directory` };
    return { err: `cat: ${esc(path)}: no such file` };
  };

  // ----- screen -----
  const lines = []; // finished lines (HTML)
  let buffer = "";
  let ready = false;
  const history = [];
  let hIndex = 0;
  const prompt = () => `<span class="c">${cwd === "~" ? "" : esc(cwd.replace("~/", "")) + " "}$</span> `;
  const render = (cursorIdle = true) => {
    screen.innerHTML =
      (lines.length ? lines.join("\n") + "\n" : "") +
      (ready ? prompt() + esc(buffer) + `<span class="term__cursor${cursorIdle ? " is-idle" : ""}"></span>` : "");
    screen.scrollTop = screen.scrollHeight;
  };
  const out = (...ls) => lines.push(...ls);

  const COMMANDS = {
    help: () =>
      out(
        "commands:",
        "  ls [-a]        list files",
        "  cat &lt;file&gt;     read a file",
        "  cd &lt;dir&gt;       change directory",
        "  open &lt;name&gt;    open a project or link",
        "  whoami  pwd  date  echo  history  clear",
        "  ...and a few you'll have to find"
      ),
    ls: (args) => {
      const all = args.includes("-a") || args.includes("-la");
      const target = args.find((a) => !a.startsWith("-"));
      const items = listDir(resolve(target || "."), all);
      if (!items) return out(`ls: ${esc(target)}: no such directory`);
      out(items.map((i) => (i.endsWith("/") ? `<span class="d">${esc(i)}</span>` : esc(i))).join("   "));
    },
    cd: (args) => {
      const t = resolve(args[0]);
      if (t === "~" || t === "~/projects") cwd = t;
      else out(`cd: ${esc(args[0])}: no such directory`);
    },
    pwd: () => out(cwd === "~" ? "/home/yang" : "/home/yang/projects"),
    cat: (args) => {
      if (!args.length) return out("cat: which file? try  ls");
      for (const a of args) {
        const r = readFile(a);
        r.err ? out(r.err) : out(...r.lines);
      }
    },
    open: (args) => {
      const key = (args[0] || "").toLowerCase().replace(/\.md$/, "");
      if (!OPENABLE[key]) return out("open: try one of " + Object.keys(OPENABLE).join(", "));
      out("opening " + esc(key) + "...");
      window.open(OPENABLE[key], "_blank", "noopener");
    },
    whoami: () => out("turing scholar (cs honors) + math @ ut austin"),
    date: () => out(esc(new Date().toString())),
    echo: (args) => out(esc(args.join(" "))),
    history: () => out(...history.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`)),
    clear: () => (lines.length = 0),
    neofetch: () =>
      out(
        '<span class="c">yang</span>@<span class="c">portfolio</span>',
        "-------------------",
        "os      html / css / js",
        "host    github pages",
        "shell   hand-rolled, no libraries",
        "theme   monochrome"
      ),
    sudo: (args) => {
      if (args.join(" ").toLowerCase() === "hire yang") {
        out("[sudo] password for recruiter: ********", "access granted.", `next step: ${link("mailto:yangbai2026@gmail.com?subject=Let's%20talk", "yangbai2026@gmail.com")}`);
      } else out("nice try. this incident will be reported.");
    },
    rm: () => out("rm: not on my watch."),
    exit: () => out("there is no escape. (try scrolling down instead)"),
    vim: () => out("you are now stuck in vim forever. just kidding: no vim here."),
    hi: () => out("hey! type  help  to look around."),
  };
  COMMANDS.hello = COMMANDS.hi;
  COMMANDS.ll = (a) => COMMANDS.ls(["-a", ...a]);

  const run = (raw) => {
    const line = raw.trim();
    out(prompt() + esc(raw));
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const [cmd, ...args] = line.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    fn ? fn(args) : out(`command not found: ${esc(cmd)}. try  help`);
  };

  const complete = () => {
    const parts = buffer.split(/\s+/);
    const last = parts[parts.length - 1];
    const pool =
      parts.length === 1
        ? Object.keys(COMMANDS)
        : parts[0] === "open"
        ? Object.keys(OPENABLE)
        : (listDir(cwd, true) || []);
    const hits = pool.filter((x) => x.startsWith(last));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      buffer = parts.join(" ");
    } else if (hits.length > 1) {
      out(prompt() + esc(buffer), hits.map(esc).join("   "));
    }
  };

  // ----- input -----
  const markTyped = () => {}; // hint stays visible the whole time
  input.addEventListener("input", () => {
    buffer = input.value;
    markTyped();
    render(false);
  });
  input.addEventListener("keydown", (e) => {
    if (!ready) return;
    if (e.key === "Enter") {
      e.preventDefault();
      run(buffer);
      buffer = input.value = "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
      input.value = buffer;
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      hIndex = Math.max(0, Math.min(history.length, hIndex + (e.key === "ArrowUp" ? -1 : 1)));
      buffer = input.value = history[hIndex] || "";
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      lines.length = 0;
    } else if (e.key === "c" && e.ctrlKey) {
      out(prompt() + esc(buffer) + "^C");
      buffer = input.value = "";
    } else return;
    render();
  });
  input.addEventListener("focus", () => box.classList.add("is-focused"));
  input.addEventListener("blur", () => box.classList.remove("is-focused"));
  box.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    input.focus({ preventScroll: true });
  });
  // start typing anywhere while the terminal is on screen
  document.addEventListener("keydown", (e) => {
    if (!ready || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (document.activeElement === input || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    const r = box.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    input.focus({ preventScroll: true });
  });

  // ----- intro: types a few commands once, then hands over -----
  const INTRO = [
    { cmd: "whoami", out: ["turing scholar (cs honors) + math @ ut austin"] },
    { cmd: "cat focus.txt", out: FILES["focus.txt"] },
  ];
  let skip = false;
  const typeCmd = async (cmd) => {
    for (let n = 0; n <= cmd.length; n++) {
      if (skip) break;
      screen.innerHTML = (lines.length ? lines.join("\n") + "\n" : "") + prompt() + esc(cmd.slice(0, n)) + '<span class="term__cursor"></span>';
      await sleep(55 + Math.random() * 70);
    }
  };
  const start = async (animate) => {
    if (animate) {
      document.addEventListener("keydown", () => (skip = true), { once: true });
      box.addEventListener("click", () => (skip = true), { once: true });
      await sleep(1500);
      for (const step of INTRO) {
        if (!skip) {
          await typeCmd(step.cmd);
          await sleep(skip ? 0 : 320);
        }
        out(prompt() + esc(step.cmd));
        for (const l of step.out) {
          out(esc(l));
          if (!skip) {
            render(false);
            await sleep(110);
          }
        }
        if (!skip) await sleep(500);
      }
    } else {
      for (const step of INTRO) out(prompt() + esc(step.cmd), ...step.out.map(esc));
    }
    out('<span class="m">type  help  or  ls  to look around</span>');
    ready = true;
    render();
    box.classList.add("is-ready");
    if (hint) hint.classList.add("is-shown");
  };
  if (hint) requestAnimationFrame(() => hint.classList.add("is-shown")); // visible from page load
  start(!reduceMotion);
  return { run };
})();

// ---------- hero mouse parallax (CSS reads --mx / --my) ----------
const hero = document.querySelector(".hero");
if (hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  let frame = 0;
  hero.addEventListener("mousemove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      hero.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
  });
  hero.addEventListener("mouseleave", () => {
    hero.style.setProperty("--mx", 0);
    hero.style.setProperty("--my", 0);
  });
}

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Docket demo: play while on screen, pause when scrolled away ----------
const demo = document.querySelector(".showcase__video");
if (demo && !reduceMotion && "IntersectionObserver" in window) {
  let autoPaused = false; // true only when we paused it, so a visitor's own pause sticks
  let userPaused = false;
  demo.addEventListener("pause", () => {
    if (!autoPaused) userPaused = true;
    autoPaused = false;
  });
  demo.addEventListener("play", () => (userPaused = false));
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !userPaused) {
        demo.play().catch(() => {});
      } else if (!entry.isIntersecting && !demo.paused) {
        autoPaused = true;
        demo.pause();
      }
    },
    { threshold: 0.4 }
  ).observe(demo);
}

// ---------- showcases: scroll-linked motion (CSS reads --p / --pa) ----------
// --p: -1 when the section is a screen above centre, 0 when centred, +1 a screen below.
const showcases = [...document.querySelectorAll(".showcase, .oss")];
if (showcases.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const s of showcases) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > 2 * vh) continue; // far off screen
      const p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh));
      s.style.setProperty("--p", p.toFixed(3));
      s.style.setProperty("--pa", Math.abs(p).toFixed(3));
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

// ---------- top tabs: underline the section in view ----------
const tabLinks = [...document.querySelectorAll(".topnav a")];
if (tabLinks.length) {
  const targets = tabLinks.map((a) => document.querySelector(a.getAttribute("href")));
  const markCurrent = () => {
    const y = window.innerHeight * 0.4;
    let current = -1;
    targets.forEach((t, i) => {
      if (t && t.getBoundingClientRect().top <= y) current = i;
    });
    tabLinks.forEach((a, i) => a.classList.toggle("is-current", i === current));
  };
  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(markCurrent);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", () => setTimeout(markCurrent, 50));
  markCurrent();
}
