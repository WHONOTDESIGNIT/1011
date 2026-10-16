# -*- coding: utf-8 -*-
"""Analyse the GSC not-indexed bucket URLs against the sitemap forms."""
import json
import collections

D = r"D:\001-IPL资料库-说明书-证书\MD-PRODUCTS-INFOS"
b = json.load(open(D + r"\_gsc_buckets.json", encoding="utf-8"))

for k, v in b.items():
    print("==", k, v["count"])
    for u in v["urls"][:6]:
        print("   ", u)

allu = [u for v in b.values() for u in v["urls"]]
print("\ntotal bucket urls:", len(allu))
print("ends with slash :", sum(1 for u in allu if u.endswith("/")))
print("contains /en/   :", sum(1 for u in allu if "/en/" in u))
print("contains ?      :", sum(1 for u in allu if "?" in u))
print("not https://iplmanufacturer.com prefix:", sum(1 for u in allu if not u.startswith("https://iplmanufacturer.com")))

LANGS = {"ar","cs","de","el","es","fa","fr","he","id","it","ja","ko","nl","pl",
         "pt-br","pt-pt","ro","ru","th","tr","vi","en"}
langs = collections.Counter()
for u in allu:
    rest = u.split("iplmanufacturer.com", 1)[1].strip("/")
    first = rest.split("/")[0] if rest else ""
    langs[first if first in LANGS else "(root/none)"] += 1
print("lang distribution:", dict(sorted(langs.items(), key=lambda x: -x[1])))

print("path depth:", dict(sorted(collections.Counter(u.rstrip('/').count('/') for u in allu).items())))

# how many bucket urls, after stripping a trailing slash, exist in the sitemap?
sm = set()
for v in json.load(open(D + r"\_sitemap_urls.json", encoding="utf-8")).values():
    sm.update(u.rstrip("/") for u in v)
hit = sum(1 for u in allu if u.rstrip("/") in sm)
print("bucket urls matching a sitemap url (after slash-normalisation):", hit, "/", len(allu))

# sample of bucket urls that do NOT match the sitemap
miss = [u for u in allu if u.rstrip("/") not in sm]
print("non-matching sample:")
for u in miss[:15]:
    print("   ", u)
