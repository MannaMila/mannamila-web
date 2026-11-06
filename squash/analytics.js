(() => {
  "use strict";

  // Google Analytics 4 page-view measurement for the public Mila Squash site only.
  // Property: MannaMila Websites (see docs/google-analytics.md). The measurement ID is a
  // public identifier, not a secret.
  const measurementId = "G-E0E4FPDPTB";
  const hostname = window.location.hostname.toLowerCase();

  // Never run on localhost, the mannamila.github.io preview host, or a sibling product
  // site, so preview traffic and embeds do not count as visits.
  if (hostname !== "squash.mannamila.com") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    // Host-scoped cookie: the sibling product sites still run a legacy-cookie
    // retirement script against the shared mannamila.com domain.
    cookie_domain: "squash.mannamila.com",
    cookie_flags: "SameSite=Lax;Secure",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
})();
