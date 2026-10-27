import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const created = [];
const mount = { replaceChildren(...children) { this.children = children; } };
const document = {
  documentElement: { classList: { add() {} } },
  querySelector(selector) { return selector === "[data-waitlist-container]" ? mount : null; },
  querySelectorAll() { return []; },
  createElement(tag) {
    const element = { tag, append() {} };
    created.push(element);
    return element;
  },
};
const context = vm.createContext({
  window: { location: { search: "" }, addEventListener() {}, scrollY: 0, innerHeight: 800 },
  document, URL, URLSearchParams, requestAnimationFrame: () => 0,
  fetch: () => Promise.reject(new Error("offline fixture")),
});
const source = readFileSync(new URL("../squash/app.js", import.meta.url), "utf8");
vm.runInContext(source + "\nglobalThis.api = {normalizeAvailability, availabilityCopy, mountWaitlist};", context);
const { normalizeAvailability, availabilityCopy, mountWaitlist } = context.api;
for (const value of [null, {}, { quest: { state: "unknown" } },
  { quest: { state: "available", storeUrl: "https://attacker.invalid/app" } }]) {
  const availability = normalizeAvailability(value);
  assert.equal(availability.quest.state, "preparing");
  assert.equal(availability.quest.storeUrl, null);
  assert.match(availabilityCopy(availability).status, /Preparing for Early Access/);
}
assert.equal(normalizeAvailability({ quest: { state: "review" } }).quest.state, "review");
const available = normalizeAvailability({ quest: { state: "available", storeUrl: "https://www.meta.com/experiences/mila/123/" } });
assert.equal(available.quest.state, "available");
assert.match(availabilityCopy(available).status, /Available now/);
for (const config of [null, { waitlistEnabled: false },
  { waitlistEnabled: false, waitlistFormUrl: "https://docs.google.com/forms/d/e/existing/viewform" },
  { waitlistEnabled: true, waitlistFormUrl: null },
  { waitlistEnabled: true, waitlistFormUrl: "https://docs.google.com/forms/d/e/REPLACE_WITH_PUBLIC_FORM_ID/viewform" }]) {
  mountWaitlist(config);
  assert.equal(created.length, 0, "disabled/invalid form must not mount a third-party iframe");
}
mountWaitlist({ waitlistEnabled: true, waitlistFormUrl: "https://docs.google.com/forms/d/e/configured/viewform" });
assert.equal(created.filter(node => node.tag === "iframe").length, 1);
assert.equal(mount.children[0].src, "https://docs.google.com/forms/d/e/configured/viewform?embedded=true");
console.log("Mila Squash release-state and disabled-waitlist tests passed.");
