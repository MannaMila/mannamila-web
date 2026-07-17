const supportsIntersectionObserver = "IntersectionObserver" in window;

if (supportsIntersectionObserver) {
  document.documentElement.classList.add("enhanced");
}

if (new URLSearchParams(window.location.search).has("embed")) {
  document.documentElement.classList.add("embed");
}

const REVIEW_AVAILABILITY = Object.freeze({
  quest: { state: "review", storeUrl: null },
  lastVerifiedAt: null,
});

const platformRules = {
  quest: {
    hostname: "www.meta.com",
    pathPrefix: "/",
  },
};

const normalizePlatform = (platform, name) => {
  if (!platform || platform.state !== "available") {
    return REVIEW_AVAILABILITY[name];
  }

  try {
    const url = new URL(platform.storeUrl);
    const rules = platformRules[name];
    const trusted =
      url.protocol === "https:" &&
      url.hostname === rules.hostname &&
      url.pathname.startsWith(rules.pathPrefix);

    return trusted
      ? { state: "available", storeUrl: url.toString() }
      : REVIEW_AVAILABILITY[name];
  } catch {
    return REVIEW_AVAILABILITY[name];
  }
};

const normalizeAvailability = (value) => ({
  quest: normalizePlatform(value?.quest, "quest"),
  lastVerifiedAt: typeof value?.lastVerifiedAt === "string" ? value.lastVerifiedAt : null,
});

const availabilityCopy = (availability) => {
  if (availability.quest.state === "available") {
    return {
      status: "Available now on Meta Quest 3.",
      faq: "Mila Squash is available now for Meta Quest 3 on the Meta Horizon Store.",
      kicker: "Available on Meta Quest 3",
      waitlist: "Get occasional Mila Squash updates",
    };
  }

  return {
    status: "Coming soon to Meta Quest 3. Currently in store review.",
    faq: "Mila Squash is currently in Meta Horizon Store review for Quest 3. Join the waitlist to hear when it opens.",
    kicker: "Coming to Meta Quest 3",
    waitlist: "Join the launch waitlist",
  };
};

const applyAvailability = (value) => {
  const availability = normalizeAvailability(value);
  const copy = availabilityCopy(availability);
  const status = document.querySelector("[data-availability-copy]");
  const faq = document.querySelector("[data-availability-faq]");
  const kicker = document.querySelector("[data-availability-kicker]");
  const storeLinks = document.querySelector("[data-store-links]");
  const questLink = document.querySelector('[data-store-link="quest"]');

  if (status) status.textContent = copy.status;
  if (faq) faq.textContent = copy.faq;
  if (kicker) kicker.textContent = copy.kicker;

  document.querySelectorAll("[data-waitlist-link]").forEach((link) => {
    link.textContent = copy.waitlist;
  });

  const available = availability.quest.state === "available";
  if (questLink) {
    questLink.hidden = !available;
    if (available) questLink.href = availability.quest.storeUrl;
  }

  if (storeLinks) {
    storeLinks.hidden = !available;
  }
};

const loadAvailability = () =>
  fetch("./availability.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Availability configuration was not available.");
      return response.json();
    })
    .then(applyAvailability)
    .catch(() => applyAvailability(REVIEW_AVAILABILITY));

const publicFormUrl = (value) => {
  if (typeof value !== "string" || value.includes("REPLACE_WITH_PUBLIC_FORM_ID")) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "docs.google.com") return null;
    if (!url.pathname.startsWith("/forms/")) return null;
    return url;
  } catch {
    return null;
  }
};

const mountWaitlist = (config) => {
  const mount = document.querySelector("[data-waitlist-container]");
  const configuredUrl = publicFormUrl(config?.waitlistFormUrl);
  if (!mount || !configuredUrl) return;

  const externalUrl = new URL(configuredUrl);
  externalUrl.searchParams.delete("embedded");

  const embeddedUrl = new URL(configuredUrl);
  embeddedUrl.searchParams.set("embedded", "true");

  const frame = document.createElement("iframe");
  frame.className = "form-frame";
  frame.src = embeddedUrl.toString();
  frame.title = "Join the Mila Squash launch and availability updates list";
  frame.loading = "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";

  const fallback = document.createElement("p");
  fallback.className = "form-fallback";
  fallback.append("If the form does not load, ");

  const fallbackLink = document.createElement("a");
  fallbackLink.href = externalUrl.toString();
  fallbackLink.target = "_blank";
  fallbackLink.rel = "noreferrer";
  fallbackLink.textContent = "open it in a new tab";
  fallback.append(fallbackLink, ".");

  mount.replaceChildren(frame, fallback);
};

const loadWaitlist = () =>
  fetch("./site-config.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Site configuration was not available.");
      return response.json();
    })
    .then(mountWaitlist)
    .catch(() => undefined);

const header = document.querySelector("[data-header]");
const threadStage = document.querySelector(".thread-stage");
const threadProgress = document.querySelector("[data-thread-progress]");
const navLinks = new Map(
  [...document.querySelectorAll(".site-nav a")].map((link) => [
    link.getAttribute("href").slice(1),
    link,
  ]),
);

const updateScrollDetails = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);

  if (!threadStage || !threadProgress) return;

  const bounds = threadStage.getBoundingClientRect();
  const viewportAnchor = window.innerHeight * 0.55;
  const traversed = viewportAnchor - bounds.top;
  const progress = Math.min(1, Math.max(0, traversed / bounds.height));
  threadProgress.style.setProperty("--thread-progress", progress.toFixed(3));
};

let scrollFrame;
window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateScrollDetails();
      scrollFrame = undefined;
    });
  },
  { passive: true },
);

if (supportsIntersectionObserver) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const sectionName = visible.target.dataset.section;
      navLinks.forEach((link, name) => {
        const current = name === sectionName;
        link.classList.toggle("is-current", current);
        if (current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-25% 0px -55%", threshold: [0.05, 0.2, 0.5] },
  );

  document.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));
}

window.addEventListener("resize", updateScrollDetails, { passive: true });
updateScrollDetails();
loadAvailability();
loadWaitlist();
