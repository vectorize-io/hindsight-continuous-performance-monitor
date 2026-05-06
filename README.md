# Hindsight perf dashboard

Static dashboard rendering perf-test results for [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight). Lives on the `gh-pages` branch of this repo and is served at:

**https://vectorize-io.github.io/hindsight-continuous-performance-monitor/**

## How it works

The hindsight `Performance Tests` workflow runs perf-test on every scheduled tick (and on push to dev branches), then runs `scripts/benchmarks/publish-perf-results.sh` which:

1. Enriches the perf-test JSON with commit metadata (subject, author, date, commit URL, PR URL).
2. Clones this repo's `gh-pages` branch with a PAT.
3. Writes `data/<timestamp>-<short_sha>.json`.
4. Updates `data/index.json` (manifest of all runs, newest first).
5. Commits and pushes.

The dashboard pages (`index.html`, `<suite>.html`, `compare.html`) are pure HTML + Chart.js (CDN) + a single `assets/app.js` ES module — no build step.

## Layout

```
index.html                      # Overview (mini-charts per suite, recent runs table)
retain.html                     # Per-suite detail pages
recall.html
recall-with-observations.html
consolidation.html
compare.html?a=<sha>&b=<sha>    # Two-run diff
assets/
  app.js                        # Shared logic: data loading, charts, tables
  style.css
data/
  index.json                    # Manifest of all runs
  <timestamp>-<sha>.json        # One file per run
```
