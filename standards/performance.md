# Performance Standard

## Baseline

Projects must define measurable performance and capacity targets for critical
paths where performance affects users, cost, reliability, or contractual goals.

A performance requirement records workload, environment, data volume, metric,
percentile or aggregation, target, measurement method, and allowed variance.
Comparisons use equivalent environments and include raw evidence.

Changes affecting hot paths, queries, payloads, rendering, memory, storage, or
external calls require proportionate measurement. Optimization must not reduce
correctness, accessibility, security, or observability without approval.

Regressions outside the adopted budget block the relevant gate or require a
documented exception with monitoring and remediation date.
