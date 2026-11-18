"""Writes skald/docs/landing-2026-11-17-greeks/{resolved-index.html, review-registry.json} from the
reviewed candidate and the three review reports. Run from the repository root after the arbiter's
resolved wording is in skald/index.html:  python3 docs/skald-landing-greeks-2026-11-17/tools/build-registry.py
"""
import hashlib
import json
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path

root = Path(__file__).resolve().parents[3]
site = root / "skald"
lane = root / "docs/skald-landing-greeks-2026-11-17"
out = site / "docs/landing-2026-11-17-greeks"
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.imgs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            self.meta[a.get("name", a.get("property"))] = a.get("content")
        if tag == "img":
            self.imgs.append(a)


page_text = (site / "index.html").read_text(encoding="utf-8")
page = Page()
page.feed(page_text)
alt = lambda needle: next(i["alt"] for i in page.imgs if needle in i.get("src", ""))
caption = lambda needle: re.search(needle + r"[^>]*>\s*<figcaption>(.*?)</figcaption>", page_text, re.S).group(1)

reports = {name: lane / "reviews" / name for name in ("accuracy.md", "clarity.md", "FINAL-ARBITRATION.md")}
labels = {"accuracy.md": "reviewer-1-accuracy", "clarity.md": "reviewer-2-clarity", "FINAL-ARBITRATION.md": "arbiter"}
session = {name: f"{labels[name]}:{sha(path)[:16]}" for name, path in reports.items()}
prior_path = site / "docs/landing-2026-10-02-copy-3/review-registry.json"
prior = json.loads(prior_path.read_text())

out.mkdir(parents=True, exist_ok=True)
shutil.copyfile(site / "index.html", out / "resolved-index.html")
index_sha = sha(site / "index.html")
files = ["index.html", "styles.css", "app.js", "get/index.html", "availability.json",
         "assets/greeks-library.webp", "assets/greeks-plate.webp", "assets/greek-split.webp", "assets/museum-guide.webp",
         "assets/nostos-route.webp", "assets/skald-the-greeks-og.jpg", "assets/skald-odyssey-og-0710.jpg",
         "assets/skald-odyssey-og-20261002.jpg", "assets/skald-odyssey-og-070.jpg",
         "support/index.html", "feedback/index.html", "feedback/privacy/index.html", "updates-privacy/index.html",
         "waitlist-privacy/index.html"]
extra = json.loads((lane / "registry-notes.json").read_text())

registry = {
    "registry": "skald-landing-greeks-2026-11-17",
    "date": "2026-11-17",
    "decision": "APPROVED",
    "approvalScope": extra["approvalScope"],
    "roles": [
        {"role": "Independent content reviewer 1: accuracy, source anchors, claims", "model": "claude-opus-5-5", "effort": "low",
         "sessionId": session["accuracy.md"], "report": {"md": "docs/skald-landing-greeks-2026-11-17/reviews/accuracy.md"}},
        {"role": "Independent content reviewer 2: reader usefulness, clarity, provenance", "model": "claude-opus-5-5", "effort": "low",
         "sessionId": session["clarity.md"], "report": {"md": "docs/skald-landing-greeks-2026-11-17/reviews/clarity.md"}},
        {"role": "Final content arbiter", "model": "claude-opus-5-5", "effort": "low", "sessionId": session["FINAL-ARBITRATION.md"],
         "decision": extra["arbiterDecision"],
         "substitution": {"stands_in_for": "gpt-6-sol", "agents_md_role": "gpt-5.6-sol/high",
                          "reason": "Codex weekly usage at 94% until 2026-11-18; owner rulings 2026-09-30 (Opus stand-in, low effort)."},
         "report": {"md": "docs/skald-landing-greeks-2026-11-17/reviews/FINAL-ARBITRATION.md"}},
    ],
    "sessionIdNote": "No harness session identifiers are recorded. As in the 2026-10-02 registries, each sessionId is the role name plus the first 16 hex characters of that role's review file sha256; they are distinct labels, not harness session ids.",
    "reviewInputSha256": {f"docs/skald-landing-greeks-2026-11-17/reviews/{name}": sha(path) for name, path in reports.items()}
    | {"skald/index.html (candidate as reviewed, at " + extra["candidateCommit"] + ")": extra["candidateIndexSha256"]},
    "websiteFilesSha256": {name: sha(site / name) for name in files},
    "websiteAssetSourceCaptures": extra["websiteAssetSourceCaptures"],
    "websiteImageCacheKey": "?v=081-20261117 (the two 0.8.1 captures); ?v=0710-20261002 (the three 0.7.10 captures, unchanged)",
    "websiteTextBindings": {
        "product_name": "Skald: the Greeks",
        "former_product_name": "Skald: Odyssey",
        "former_product_name_mentions": page_text.count("Skald: Odyssey"),
        "hero_alt": alt("greeks-library.webp"),
        "hero_caption": caption("greeks-library.webp"),
        "plate_alt": alt("greeks-plate.webp"),
        "plate_caption": caption("greeks-plate.webp"),
        "greek_alt": alt("greek-split.webp"),
        "art_alt": alt("museum-guide.webp"),
        "map_alt": alt("nostos-route.webp"),
        "art_caption": "Open an artwork alongside the poem.",
        "og_and_twitter_image_alt": page.meta["og:image:alt"],
        "og_and_twitter_image_url": page.meta["og:image"],
        "og_card_text_lines": ["Skald: the Greeks", "Spend some time with the Greeks."],
        "availability_sentence": prior["websiteTextBindings"]["availability_sentence"],
        "forbidden_stale_framing": prior["websiteTextBindings"]["forbidden_stale_framing"],
        "allowed_next_update_heading": prior["websiteTextBindings"]["allowed_next_update_heading"],
    },
    "approved_sha256": {"resolved-index.html": index_sha},
    "supersession": {"priorWebsiteRegistry": {
        "path": "skald/docs/landing-2026-10-02-copy-3/review-registry.json",
        "sha256": sha(prior_path),
        "supersededEntries": {"approved_sha256.resolved-index.html": prior["approved_sha256"]["resolved-index.html"]},
        "replacement": index_sha,
        "note": "Supersedes the landing index hash, the share-card binding and the image bindings of the copy-3 registry. Chain: this registry -> landing-2026-10-02-copy-3 -> landing-2026-10-02-copy-2 -> landing-2026-10-02 -> store-web-2026-09-15-native -> store-web-2026-09-13. Keep the history.",
    }},
    "ownerDirectedAmendments": extra.get("ownerDirectedAmendments", []),
    "nonBlockingFollowUps": extra["nonBlockingFollowUps"],
    "claimsNotMade": extra["claimsNotMade"],
    "outputs": {"registry": "skald/docs/landing-2026-11-17-greeks/review-registry.json",
                "resolvedIndex": "skald/docs/landing-2026-11-17-greeks/resolved-index.html"},
}
(out / "review-registry.json").write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("wrote", out / "review-registry.json", "index", index_sha[:12])
