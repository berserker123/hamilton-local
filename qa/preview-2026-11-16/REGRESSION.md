# Visual regression — 活动日历 16–22 Nov 2026

Command (repo root, after `npm run build` in `source/`):

```
node qa/visual-regression.mjs check
```

`qa/baseline/` was not rewritten. `qa/exclude.txt` was not edited. The script’s cutoff is a mean channel difference above 1.6. Exit code was 1 because every change is labelled UNEXPECTED while `qa/exclude.txt` is empty.

## Script output

```
SHOTS 120
SAME 94
CHANGED 26
changed	2.01	UNEXPECTED	day/desktop/footer-home.jpg
changed	4.3	UNEXPECTED	day/desktop/footer-living.jpg
changed	2.63	UNEXPECTED	day/desktop/living-dining.jpg
changed	4.19	UNEXPECTED	day/desktop/living-grocers.jpg
changed	9.1	UNEXPECTED	day/desktop/living-places.jpg
changed	6.12	UNEXPECTED	day/desktop/living-stays.jpg
changed	5.52	UNEXPECTED	day/desktop/living-upick.jpg
changed	3.21	UNEXPECTED	day/mobile/footer-living.jpg
changed	9.07	UNEXPECTED	day/mobile/living-dining.jpg
changed	8.89	UNEXPECTED	day/mobile/living-grocers.jpg
changed	19.18	UNEXPECTED	day/mobile/living-places.jpg
changed	13.77	UNEXPECTED	day/mobile/living-stays.jpg
changed	13.62	UNEXPECTED	day/mobile/living-upick.jpg
changed	1.78	UNEXPECTED	night/desktop/footer-home.jpg
changed	3.9	UNEXPECTED	night/desktop/footer-living.jpg
changed	2.21	UNEXPECTED	night/desktop/living-dining.jpg
changed	3.48	UNEXPECTED	night/desktop/living-grocers.jpg
changed	8.52	UNEXPECTED	night/desktop/living-places.jpg
changed	4.17	UNEXPECTED	night/desktop/living-stays.jpg
changed	4.1	UNEXPECTED	night/desktop/living-upick.jpg
changed	3.2	UNEXPECTED	night/mobile/footer-living.jpg
changed	7.72	UNEXPECTED	night/mobile/living-dining.jpg
changed	9.11	UNEXPECTED	night/mobile/living-grocers.jpg
changed	13.71	UNEXPECTED	night/mobile/living-places.jpg
changed	9.02	UNEXPECTED	night/mobile/living-stays.jpg
changed	9.44	UNEXPECTED	night/mobile/living-upick.jpg
```

## Views that actually show this week’s calendar

The viewport shots of 活动日历 do change, but the hero photo keeps the mean under 1.6, so the script prints them as same:

| view | mean |
| --- | ---: |
| day/desktop/weekend-picks.jpg | 0.81 |
| day/mobile/weekend-picks.jpg | 0.70 |
| night/desktop/weekend-picks.jpg | 0.89 |
| night/mobile/weekend-picks.jpg | 0.79 |
| day/desktop/footer-weekend.jpg | 0.27 |
| night/desktop/footer-weekend.jpg | 0.15 |
| day/mobile/footer-weekend.jpg | 0.00 |
| night/mobile/footer-weekend.jpg | 0.00 |
| day/desktop/weekend-markets.jpg | 0.15 |
| night/desktop/weekend-markets.jpg | 0.19 |
| day/mobile/weekend-markets.jpg | 0.41 |
| night/mobile/weekend-markets.jpg | 0.51 |
| day/desktop/home.jpg | 0.00 |
| night/desktop/home.jpg | 0.00 |
| day/mobile/home.jpg | 0.00 |
| night/mobile/home.jpg | 0.00 |
| day/mobile/footer-home.jpg | 0.29 |
| night/mobile/footer-home.jpg | 0.33 |

A crop of `day/desktop/weekend-picks.jpg` shows the new heading `11月16日–22日`, `27 项活动`, and 创客手作聚会 Makers Common. The baseline crop still shows `11月10日–16日` and `37 项活动`.

## Flagged views that this preview did not edit

### 本地生活 (living-*) and footer-living

Baseline commit `97019ab` (14 Nov 2026) is older than the Black Friday tab already on `main` (`e0e8f80` through `ac0fcf8`). Current shots add a sixth tab, 黑五专区 / Black Friday, on every 本地生活 sub-tab. The grocery cards underneath are the same. This branch does not change living pages. The baseline was not updated, per the preview rules.

### footer-home (desktop only)

`day/desktop/footer-home.jpg` mean 2.01 and `night/desktop/footer-home.jpg` mean 1.78. The same footer copy is present in both images. The dark gaps between cards sit one pixel lower than the baseline. Mobile footer-home stays under the cutoff. The home top (`home.jpg`) is identical, so the week label and the three homepage preview titles are below that viewport.

## Markets tab price lookup (not flagged)

`MarketRow` still copies a price from `events_this_week` when `town` and `title_zh` match, and otherwise shows 费用待确认. `markets` was not edited. Compared with the 10–16 Nov file, the text that would show on 周末集市 changes for:

- 花园美食集 Gourmet in the Gardens: qualifier shortened to 免费入场（受天气影响）
- 拉格伦种植者市集 Raglan Growers Market: now 免费
- Fair Share and Matamata are no longer in this week’s events, so those directory rows fall back to 费用待确认

Those rows sit below the hero in the viewport shots, so `weekend-markets` stayed under 1.6. Fixing the pills would mean editing `markets`, keeping expired events, or changing `MarketRow`. None of those were in scope.

## Status pills checked on the new page

Computed backgrounds on `#/weekend?tab=picks`, all regions:

- Day 免费: `rgb(230, 184, 78)` (`#E6B84E`)
- Day 待确认: `rgb(213, 224, 232)` (`#D5E0E8`)
- Night 免费: `rgb(230, 197, 106)` (`#E6C56A`)
- Night 待确认: `rgb(62, 90, 110)` (`#3E5A6E`)
- Priced pills use the clay fill (`rgb(163, 70, 30)` day, `rgb(200, 164, 106)` night)

Strings that are exactly 免费 render as 免费 / Free. This week has no price that is exactly 免费入场, so qualified lines such as 免费入场（受天气影响） stay as written. Two priced lines also contain 免费 (the Claudelands child/youth prices). Existing `priceTone` treats any 免费 as the honey pill. That code was not changed.
