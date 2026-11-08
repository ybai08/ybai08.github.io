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

// ---------- hero terminal: types commands on a loop ----------
const TERMINAL_SCRIPT = [
  { cmd: "whoami", out: ["turing scholar (cs honors) + math @ ut austin"] },
  { cmd: "cat focus.txt", out: ["web, mobile & backend apps", "ai, ml systems & tooling", "open source"] },
  { cmd: "ls projects/", out: ["spartan/  docket/  soup/  surfsense/"] },
];

const termPre = document.querySelector(".hero__terminal pre");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTerminal() {
  const prompt = '<span class="c">$</span> ';
  // wait for the terminal's entrance animation
  await sleep(1500);
  for (;;) {
    let done = ""; // finished lines (HTML)
    for (const step of TERMINAL_SCRIPT) {
      for (let n = 0; n <= step.cmd.length; n++) {
        termPre.innerHTML = done + prompt + esc(step.cmd.slice(0, n)) + '<span class="term__cursor"></span>';
        await sleep(55 + Math.random() * 70);
      }
      await sleep(320);
      done += prompt + esc(step.cmd) + "\n";
      for (const line of step.out) {
        done += esc(line) + "\n";
        termPre.innerHTML = done + '<span class="term__cursor"></span>';
        await sleep(110);
      }
      await sleep(650);
    }
    termPre.innerHTML = done + prompt + '<span class="term__cursor is-idle"></span>';
    await sleep(6000);
    termPre.classList.add("is-clearing");
    await sleep(450);
    termPre.innerHTML = "";
    termPre.classList.remove("is-clearing");
    await sleep(300);
  }
}
if (termPre && !reduceMotion) runTerminal();

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
