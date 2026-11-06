// Runs squash/app.js in a minimal DOM stand-in and checks the release-state rules:
// untrusted URLs fall back to the verified alpha invite, store URLs must be Meta's, and the
// Google Form only mounts when site-config.json enables it with a real docs.google.com URL.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const INVITE = "https://www.meta.com/s/8gekrWSxj";

const makeElement = (tag, attributes = {}) => ({
  tag,
  hidden: true,
  dataset: {},
  ...attributes,
  append() {},
  closest: () => null,
});

const created = [];
const mount = { replaceChildren(...children) { this.children = children; } };
const signupSection = makeElement("section");
const signupLink = makeElement("a");
const inviteLinks = [makeElement("a", { hidden: false, href: "#" }), makeElement("a", { hidden: false, href: "#", dataset: { inviteLink: "labelled" } })];
const document = {
  documentElement: { classList: { add() {} } },
  addEventListener() {},
  querySelector(selector) {
    return selector === "[data-signup-container]" ? mount : null;
  },
  querySelectorAll(selector) {
    if (selector === "[data-signup-section], [data-signup-link]") return [signupSection, signupLink];
    if (selector === "[data-invite-link]") return inviteLinks;
    return [];
  },
  createElement(tag) {
    const element = { tag, append() {} };
    created.push(element);
    return element;
  },
};
const context = vm.createContext({
  window: { location: { search: "" }, addEventListener() {}, scrollY: 0, innerHeight: 800 },
  document,
  URL,
  URLSearchParams,
  requestAnimationFrame: () => 0,
  fetch: () => Promise.reject(new Error("offline fixture")),
});
const source = readFileSync(new URL("../squash/app.js", import.meta.url), "utf8");
vm.runInContext(
  `${source}\nglobalThis.api = { normalizeAvailability, availabilityCopy, applyAvailability, mountSignup };`,
  context,
);
const { normalizeAvailability, availabilityCopy, applyAvailability, mountSignup } = context.api;

for (const value of [
  null,
  {},
  { quest: { state: "unknown" } },
  { quest: { state: "alpha", inviteUrl: "https://attacker.invalid/s/abc" } },
  { quest: { state: "alpha", inviteUrl: "http://www.meta.com/s/abc" } },
  { quest: { state: "available", storeUrl: "https://attacker.invalid/app" } },
  { quest: { state: "available", storeUrl: null } },
]) {
  const availability = normalizeAvailability(value);
  assert.equal(availability.quest.state, "alpha", `fallback for ${JSON.stringify(value)}`);
  assert.equal(availability.quest.inviteUrl, INVITE);
  assert.equal(availability.quest.storeUrl, null);
  assert.match(availabilityCopy(availability).status, /Private alpha on Meta Quest 3/);
}

const alpha = normalizeAvailability({ quest: { state: "alpha", inviteUrl: INVITE }, lastVerifiedAt: "2026-11-06T17:22:14Z" });
assert.equal(alpha.quest.inviteUrl, INVITE);
assert.equal(alpha.lastVerifiedAt, "2026-11-06T17:22:14Z");
assert.match(availabilityCopy(alpha).faq, /reviewed by hand/);
assert.match(availabilityCopy(alpha).faq, /18 or older/);

assert.equal(normalizeAvailability({ quest: { state: "review" } }).quest.state, "review");
assert.match(availabilityCopy(normalizeAvailability({ quest: { state: "review" } })).status, /store review/);

const available = normalizeAvailability({ quest: { state: "available", storeUrl: "https://www.meta.com/experiences/mila/123/" } });
assert.equal(available.quest.state, "available");
assert.equal(available.quest.storeUrl, "https://www.meta.com/experiences/mila/123/");
assert.match(availabilityCopy(available).status, /Available now/);

applyAvailability({ quest: { state: "alpha", inviteUrl: INVITE } });
for (const link of inviteLinks) {
  assert.equal(link.href, INVITE, "invite links point at the verified Meta page");
  assert.equal(link.hidden, false);
}
assert.equal(inviteLinks[1].textContent, "Request alpha access", "labelled links take the state's call to action");
assert.equal(inviteLinks[0].textContent, undefined, "unlabelled links keep their own text");

applyAvailability({ quest: { state: "available", storeUrl: "https://www.meta.com/experiences/mila/123/" } });
assert.equal(inviteLinks[0].href, "https://www.meta.com/experiences/mila/123/");
assert.equal(inviteLinks[1].textContent, "Get it on the Meta Horizon Store");

for (const config of [
  null,
  {},
  { signupEnabled: false },
  { signupEnabled: false, signupFormUrl: "https://docs.google.com/forms/d/e/existing/viewform" },
  { signupEnabled: true, signupFormUrl: null },
  { signupEnabled: true, signupFormUrl: "https://docs.google.com/forms/d/e/REPLACE_WITH_PUBLIC_FORM_ID/viewform" },
  { signupEnabled: true, signupFormUrl: "https://attacker.invalid/forms/d/e/x/viewform" },
  { signupEnabled: true, signupFormUrl: "https://docs.google.com/spreadsheets/d/x/edit" },
  { signupEnabled: "true", signupFormUrl: "https://docs.google.com/forms/d/e/configured/viewform" },
]) {
  mountSignup(config);
  assert.equal(created.length, 0, `disabled/invalid form must not mount an iframe: ${JSON.stringify(config)}`);
  assert.equal(signupSection.hidden, true, "the signup section stays hidden without a form");
  assert.equal(signupLink.hidden, true, "signup links stay hidden without a form");
}

mountSignup({ signupEnabled: true, signupFormUrl: "https://docs.google.com/forms/d/e/configured/viewform" });
assert.equal(created.filter((node) => node.tag === "iframe").length, 1);
assert.equal(mount.children[0].src, "https://docs.google.com/forms/d/e/configured/viewform?embedded=true");
assert.equal(mount.children[0].referrerPolicy, "strict-origin-when-cross-origin");
assert.equal(signupSection.hidden, false, "a configured form reveals the signup section");
assert.equal(signupLink.hidden, false, "a configured form reveals the signup links");

console.log("Mila Squash release-state, invite-link and signup-mount tests passed.");
