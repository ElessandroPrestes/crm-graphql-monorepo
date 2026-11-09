# Coding Standard

## Baseline

Each adopting project must record its language-specific formatter, linter, type
checks, conventions, generated-code policy, and executable commands in
`PROJECT.md` or an active profile.

Implementation must:

- follow established local patterns unless an approved change replaces them;
- keep responsibilities and public contracts explicit;
- handle errors without concealing failure or sensitive information;
- avoid unrelated cleanup and unjustified dependencies;
- include comments for intent and constraints, not obvious syntax;
- remove dead paths introduced by the same change;
- pass formatting, static analysis, build, and tests applicable to the change.

Exceptions identify the rule, scope, reason, risk, owner, and remediation target.
