# Visual check - Events Calendar 23-29 Nov 2026

The repo's own `node qa/visual-regression.mjs check` could not be used as-is on Magicbox-Frank: it needs python3 + Pillow (not installed) and `qa/baseline/` was rendered on Linux, so every shot differs from a Windows Chromium render (font rendering), including pages this round never touches.

Like-for-like check instead (same machine, same Playwright, same script capture code):

1. `origin/main` (37f4f07) was built in a throw-away worktree and captured with `node qa/visual-regression.mjs baseline` (120 shots: day/night x desktop/mobile x 30 views).
2. This branch was built and captured with the same script (`check`, up to the capture step).
3. The two sets were compared with the same metric as the script (mean absolute channel difference per image, "changed" above 1.6).

Result: 120 shots, 120 same, 0 changed, largest difference 1.15.
The Events Calendar and Weekend Markets shots differ slightly (weekend-picks 0.78-1.15, weekend-markets 0.42-0.67) because only the top of those pages is in the 1280x800 / 390x844 viewport. Home, Tools, Living, Kids, Services and every footer shot are byte-identical (0.000 for home, tools, services).

Full-page shots of the new calendar: `events-calendar-{desktop,mobile}-{day,night}.png` (desktop 1440 wide, mobile 390 wide at 2x, default Hamilton filter).

`qa/baseline/` and `qa/exclude.txt` were not touched.
