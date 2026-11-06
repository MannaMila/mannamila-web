const supportsIntersectionObserver = "IntersectionObserver" in window;

if (supportsIntersectionObserver) {
  document.documentElement.classList.add("enhanced");
}

if (new URLSearchParams(window.location.search).has("embed")) {
  document.documentElement.classList.add("embed");
}

// The verified Meta enrollment page for the Mila Squash private Alpha channel. The HTML
// carries the same URL, so the call to action works before and without JavaScript.
const ALPHA_INVITE_URL = "https://www.meta.com/s/8gekrWSxj";

const ALPHA_AVAILABILITY = Object.freeze({
  quest: { state: "alpha", inviteUrl: ALPHA_INVITE_URL, storeUrl: null },
  lastVerifiedAt: null,
});

const trustedMetaUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.meta.com" ? url.toString() : null;
  } catch {
    return null;
  }
};

const normalizePlatform = (platform) => {
  if (platform?.state === "available") {
    const storeUrl = trustedMetaUrl(platform.storeUrl);
    if (storeUrl) return { state: "available", inviteUrl: null, storeUrl };
  }

  if (platform?.state === "alpha") {
    const inviteUrl = trustedMetaUrl(platform.inviteUrl);
    if (inviteUrl) return { state: "alpha", inviteUrl, storeUrl: null };
  }

  if (platform?.state === "review") return { state: "review", inviteUrl: null, storeUrl: null };

  return ALPHA_AVAILABILITY.quest;
};

const normalizeAvailability = (value) => ({
  quest: normalizePlatform(value?.quest),
  lastVerifiedAt: typeof value?.lastVerifiedAt === "string" ? value.lastVerifiedAt : null,
});

const availabilityCopy = (availability) => {
  if (availability.quest.state === "available") {
    return {
      status: "Available now on Meta Quest 3.",
      faq: "Mila Squash is available for Meta Quest 3 on the Meta Horizon Store.",
      kicker: "Available on Meta Quest 3",
      cta: "Get it on the Meta Horizon Store",
    };
  }

  if (availability.quest.state === "review") {
    return {
      status: "Coming to Meta Quest 3. Currently in store review.",
      faq: "Mila Squash is in Meta Horizon Store review for Quest 3. Availability will be announced here.",
      kicker: "Coming to Meta Quest 3",
      cta: "Request alpha access",
    };
  }

  return {
    status: "Private alpha on Meta Quest 3. Requests are reviewed by hand.",
    faq: "Mila Squash is in a private alpha on Meta Quest 3. Request access through Meta; requests are reviewed by hand, testers must be 18 or older, and the channel holds 200 people. The store release date is not set.",
    kicker: "Private alpha on Meta Quest 3",
    cta: "Request alpha access",
  };
};

const applyAvailability = (value) => {
  const availability = normalizeAvailability(value);
  const copy = availabilityCopy(availability);
  const status = document.querySelector("[data-availability-copy]");
  const faq = document.querySelector("[data-availability-faq]");
  const kicker = document.querySelector("[data-availability-kicker]");

  if (status) status.textContent = copy.status;
  if (faq) faq.textContent = copy.faq;
  if (kicker) kicker.textContent = copy.kicker;

  const destination = availability.quest.storeUrl ?? availability.quest.inviteUrl;
  document.querySelectorAll("[data-invite-link]").forEach((link) => {
    if (destination) {
      link.href = destination;
      link.hidden = false;
    } else {
      link.hidden = true;
    }
    if (link.dataset.inviteLink === "labelled") link.textContent = copy.cta;
  });
};

const loadAvailability = () =>
  fetch("./availability.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Availability configuration was not available.");
      return response.json();
    })
    .then(applyAvailability)
    .catch(() => applyAvailability(ALPHA_AVAILABILITY));

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

const mountSignup = (config) => {
  if (config?.signupEnabled !== true) return;
  const mount = document.querySelector("[data-signup-container]");
  const configuredUrl = publicFormUrl(config?.signupFormUrl);
  if (!mount || !configuredUrl) return;

  const externalUrl = new URL(configuredUrl);
  externalUrl.searchParams.delete("embedded");

  const embeddedUrl = new URL(configuredUrl);
  embeddedUrl.searchParams.set("embedded", "true");

  const frame = document.createElement("iframe");
  frame.className = "form-frame";
  frame.src = embeddedUrl.toString();
  frame.title = "Join the Mila Squash alpha list";
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

  document.querySelectorAll("[data-signup-section], [data-signup-link]").forEach((element) => {
    element.hidden = false;
  });
};

const loadSignup = () =>
  fetch("./site-config.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Site configuration was not available.");
      return response.json();
    })
    .then(mountSignup)
    .catch(() => undefined);

// Count clicks on the alpha request link as a Google Analytics event when the loader is
// active. No personal data: the event carries only which link on the page was used.
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("[data-invite-link]");
  if (!link || typeof window.gtag !== "function") return;
  window.gtag("event", "alpha_request_click", {
    link_location: link.closest("[data-section]")?.dataset.section ?? "header",
  });
});

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
loadSignup();
