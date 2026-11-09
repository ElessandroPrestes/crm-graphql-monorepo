# Database Standard

## Baseline

Data changes must specify ownership, schema impact, compatibility, privacy,
volume, migration, verification, rollback or recovery, and operational risk.

- Prefer backward-compatible expand-and-contract migrations for rolling systems.
- Make retries and partial failure safe where migrations can be interrupted.
- Never assume production volume from development fixtures.
- Backfills need batching, throttling, observability, restartability, and reconciliation.
- Destructive changes require explicit approval and a tested recovery strategy.
- Constraints and transactions must preserve documented invariants.
- Test data must be deterministic and privacy-safe.

Schema and contract changes link to their SPEC and ADR when architectural.
