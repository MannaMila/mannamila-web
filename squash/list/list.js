// Mounts the Mila Squash alpha-list Google Form from ../site-config.json. The HTML keeps a
// plain link to the same form, so the page works without JavaScript.
(() => {
  "use strict";

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

  const mount = (config) => {
    const container = document.querySelector("[data-signup-container]");
    const configuredUrl = publicFormUrl(config?.signupFormUrl);
    if (!container || config?.signupEnabled !== true || !configuredUrl) return;

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
    const link = document.createElement("a");
    link.href = externalUrl.toString();
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "open it in a new tab";
    fallback.append(link, ".");

    container.replaceChildren(frame, fallback);
  };

  fetch("../site-config.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Site configuration was not available.");
      return response.json();
    })
    .then(mount)
    .catch(() => undefined);
})();
