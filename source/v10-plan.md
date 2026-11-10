# Local preview implementation

1. Record existing store data, photo hashes and Chinese terminology locations.
2. Replace 急症 in UI sources; reorder the six existing supermarket records without changing their contents.
3. Copy all nine supplied teaser images into public/photos. Import the supplied manifest for style A/B/C and credits; preserve weekend/tools photos. Accept page and hash style queries, default to A, and preserve hash styles through navigation.
4. Rebuild only with build.cmd. Adapt the existing offline Chrome/CDP QA to check style queries, image loading, store grid positions, terminology, credits and navigation; capture the nine requested screenshots.
5. Inspect screenshots and write RESULT.md with licences, replacement counts, usage and caveats.

Review focus: invalid/absent style defaults; page/hash precedence; navigation retains selected style; unchanged store details; all nine attributions visible in both languages.

Validation uses the existing offline Chrome script because the Browser plugin is unavailable and TASK.md explicitly requests this capture workflow. HTTP(S) page requests remain blocked; only local files and loopback CDP control are used.
