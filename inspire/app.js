// Mila Inspire — release-aware landing behavior.
// Deliberately minimal for a calm, child-directed site: availability copy,
// trusted store links, and a header shadow. No analytics, no forms, no
// scroll-reveal animation.

const REVIEW_AVAILABILITY = Object.freeze({
  play: { state: "review", storeUrl: null },
  appstore: { state: "review", storeUrl: null },
  lastVerifiedAt: null,
});

const platformRules = {
  play: {
    hostname: "play.google.com",
    pathPrefix: "/store/apps",
  },
  appstore: {
    hostname: "apps.apple.com",
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
  play: normalizePlatform(value?.play, "play"),
  appstore: normalizePlatform(value?.appstore, "appstore"),
  lastVerifiedAt: typeof value?.lastVerifiedAt === "string" ? value.lastVerifiedAt : null,
});

const availabilityCopy = (availability) => {
  const playAvailable = availability.play.state === "available";
  const appstoreAvailable = availability.appstore.state === "available";

  if (playAvailable && appstoreAvailable) {
    return {
      status: "Available now on Google Play for Android tablets and on the App Store for iPad.",
      kicker: "Available on Google Play and the App Store",
      note: "Mila Inspire is available now for Android tablets on Google Play and for iPad on the App Store.",
    };
  }

  if (playAvailable) {
    return {
      status: "Available now on Google Play for Android tablets. Coming soon to the App Store for iPad.",
      kicker: "Available on Google Play",
      note: "Mila Inspire is available now for Android tablets on Google Play. The iPad release is still being prepared for the App Store.",
    };
  }

  if (appstoreAvailable) {
    return {
      status: "Available now on the App Store for iPad. Coming soon to Google Play for Android tablets.",
      kicker: "Available on the App Store",
      note: "Mila Inspire is available now for iPad on the App Store. The Android tablet release is still being prepared for Google Play.",
    };
  }

  return {
    status: "Coming soon to Google Play for Android tablets and to the App Store for iPad.",
    kicker: "Coming to Google Play and the App Store",
    note: "Mila Inspire is being prepared for Google Play (Android tablets) and the App Store (iPad). This page will link to both stores when they open.",
  };
};

const applyAvailability = (value) => {
  const availability = normalizeAvailability(value);
  const copy = availabilityCopy(availability);
  const status = document.querySelector("[data-availability-copy]");
  const kicker = document.querySelector("[data-availability-kicker]");
  const note = document.querySelector("[data-availability-note]");
  const storeLinks = document.querySelector("[data-store-links]");
  const playLink = document.querySelector('[data-store-link="play"]');
  const appstoreLink = document.querySelector('[data-store-link="appstore"]');

  if (status) status.textContent = copy.status;
  if (kicker) kicker.textContent = copy.kicker;
  if (note) note.textContent = copy.note;

  const playAvailable = availability.play.state === "available";
  const appstoreAvailable = availability.appstore.state === "available";

  if (playLink) {
    playLink.hidden = !playAvailable;
    if (playAvailable) playLink.href = availability.play.storeUrl;
  }

  if (appstoreLink) {
    appstoreLink.hidden = !appstoreAvailable;
    if (appstoreAvailable) appstoreLink.href = availability.appstore.storeUrl;
  }

  if (storeLinks) {
    storeLinks.hidden = !(playAvailable || appstoreAvailable);
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

const header = document.querySelector("[data-header]");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

let scrollFrame;
window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateHeader();
      scrollFrame = undefined;
    });
  },
  { passive: true },
);

updateHeader();
loadAvailability();
