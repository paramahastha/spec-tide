# SC-005 performance results

**Result: PASS** — nearest-rank p95 is 208.94 ms, below the 2,000 ms target.

| Field                 | Observed                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tracked regular files | 100,000                                                                                                                                                        |
| Warm-up               | 201.75 ms                                                                                                                                                      |
| 20 measured runs (ms) | 189.87, 202.68, 208.94, 206.20, 202.86, 204.54, 202.05, 203.61, 199.85, 188.55, 191.66, 201.75, 203.87, 198.99, 190.77, 193.36, 205.96, 200.41, 210.71, 200.63 |
| Nearest-rank p95      | 208.94 ms                                                                                                                                                      |
| OS                    | Darwin 24.1.0 arm64                                                                                                                                            |
| CPU                   | Apple M4                                                                                                                                                       |
| Node.js               | v24.22.1                                                                                                                                                       |
| Git                   | git version 2.39.5 (Apple Git-154)                                                                                                                             |
| Pass/fail             | PASS                                                                                                                                                           |

The result was collected on the pinned Node.js 24 runtime.
