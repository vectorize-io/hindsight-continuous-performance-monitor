window.BENCHMARK_DATA = {
  "lastUpdate": 1778062784721,
  "repoUrl": "https://github.com/vectorize-io/hindsight",
  "entries": {
    "Hindsight Latency": [
      {
        "commit": {
          "author": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "committer": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "distinct": true,
          "id": "a2505a2f57bcaf5d8bcbce2b9286614601f45ec5",
          "message": "feat(perf): publish perf-test results to external dashboard repo\n\nAdds `--benchmark-output-dir` to perf-test, which emits two JSON files\nin github-action-benchmark format: latency.json (smaller-is-better:\ndurations + recall p50/p95/p99/mean) and throughput.json (bigger-is-\nbetter: items/queries/memories per sec). The Performance Tests workflow\nnow publishes both to vectorize-io/hindsight-continuous-performance-\nmonitor's gh-pages branch on each scheduled run.\n\nIteration mode (TEMP — search \"TEMP\" to revert before merge):\npush trigger on this branch, default scale=small, locomo skipped\nunless manually dispatched.\n\nSetup needed (one-time):\n- PAT with Contents:write on the dashboard repo, stored as secret\n  PERF_DASHBOARD_TOKEN.\n- After the first run creates gh-pages there, enable Pages on that\n  repo (Settings → Pages → gh-pages branch).",
          "timestamp": "2026-05-06T11:35:37+02:00",
          "tree_id": "2647a799315be9fe2cfa532e63b58d4ad8c0a778",
          "url": "https://github.com/vectorize-io/hindsight/commit/a2505a2f57bcaf5d8bcbce2b9286614601f45ec5"
        },
        "date": 1778062560566,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "retain duration",
            "value": 6.712,
            "unit": "s"
          },
          {
            "name": "recall latency mean",
            "value": 0.4656,
            "unit": "s"
          },
          {
            "name": "recall latency p50",
            "value": 0.4595,
            "unit": "s"
          },
          {
            "name": "recall latency p95",
            "value": 0.5086,
            "unit": "s"
          },
          {
            "name": "recall latency p99",
            "value": 0.5086,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency mean",
            "value": 0.5496,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p50",
            "value": 0.4912,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p95",
            "value": 0.9188,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p99",
            "value": 0.9188,
            "unit": "s"
          },
          {
            "name": "consolidation duration",
            "value": 33.644,
            "unit": "s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "committer": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "distinct": true,
          "id": "1bb78865b6c34ac9573f8900f92f66cc341f9317",
          "message": "fix(perf): wipe benchmark working dir between latency and throughput publishes\n\ngithub-action-benchmark clones the dashboard repo into a fixed\n./benchmark-data-repository directory and doesn't clean up, so the\nsecond invocation in the same job fails with 'destination path already\nexists'.",
          "timestamp": "2026-05-06T12:16:58+02:00",
          "tree_id": "b05d76d8526fddbe9c01bb9a38e3e257067ae146",
          "url": "https://github.com/vectorize-io/hindsight/commit/1bb78865b6c34ac9573f8900f92f66cc341f9317"
        },
        "date": 1778062783097,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "retain duration",
            "value": 8.874,
            "unit": "s"
          },
          {
            "name": "recall latency mean",
            "value": 0.6169,
            "unit": "s"
          },
          {
            "name": "recall latency p50",
            "value": 0.6149,
            "unit": "s"
          },
          {
            "name": "recall latency p95",
            "value": 0.6813,
            "unit": "s"
          },
          {
            "name": "recall latency p99",
            "value": 0.6813,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency mean",
            "value": 0.7406,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p50",
            "value": 0.6536,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p95",
            "value": 1.0135,
            "unit": "s"
          },
          {
            "name": "recall-with-observations latency p99",
            "value": 1.0135,
            "unit": "s"
          },
          {
            "name": "consolidation duration",
            "value": 40.563,
            "unit": "s"
          }
        ]
      }
    ],
    "Hindsight Throughput": [
      {
        "commit": {
          "author": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "committer": {
            "email": "boschi1997@gmail.com",
            "name": "Nicolò Boschi",
            "username": "nicoloboschi"
          },
          "distinct": true,
          "id": "1bb78865b6c34ac9573f8900f92f66cc341f9317",
          "message": "fix(perf): wipe benchmark working dir between latency and throughput publishes\n\ngithub-action-benchmark clones the dashboard repo into a fixed\n./benchmark-data-repository directory and doesn't clean up, so the\nsecond invocation in the same job fails with 'destination path already\nexists'.",
          "timestamp": "2026-05-06T12:16:58+02:00",
          "tree_id": "b05d76d8526fddbe9c01bb9a38e3e257067ae146",
          "url": "https://github.com/vectorize-io/hindsight/commit/1bb78865b6c34ac9573f8900f92f66cc341f9317"
        },
        "date": 1778062784520,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "retain throughput",
            "value": 22.54,
            "unit": "items/s"
          },
          {
            "name": "recall throughput",
            "value": 6.48,
            "unit": "queries/s"
          },
          {
            "name": "recall-with-observations throughput",
            "value": 5.4,
            "unit": "queries/s"
          },
          {
            "name": "consolidation throughput",
            "value": 2.47,
            "unit": "memories/s"
          }
        ]
      }
    ]
  }
}