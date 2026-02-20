# Security Policy

## Dependency Vulnerability Handling

### Baseline
- Date: 2026-02-20
- Runtime stack (Electron app) and core test/build flows are updated and passing.
- Remaining `npm audit` findings are primarily in development/packaging dependency chains (`electron-builder`, lint/tooling transitive packages), with several entries marked as no fix available.

### Release Gate
- Use production/runtime scope for release blocking checks:
  - `npm audit --omit=dev`
- Block release only when runtime dependencies have unresolved moderate/high/critical findings.

### Dev-Only Findings Policy
- `npm audit` findings in dev/build/test-only dependencies are tracked but do not block release by default.
- For each unresolved item:
  - Confirm it is not loaded in production runtime path.
  - Record package, advisory, current status (`no fix`, `requires major migration`, etc.).
  - Re-evaluate on scheduled review.

### Review Cadence
- Run monthly review:
  - `npm outdated`
  - `npm audit`
  - `npm audit --omit=dev`
- Also run review immediately when:
  - Electron major/minor is upgraded
  - Packaging toolchain changes (`electron-builder`, signing/notarization flow)
  - CI base image or Node major changes

### Escalation Rules
- Immediate action required if any of the following is true:
  - Vulnerability is in runtime dependency graph (`npm audit --omit=dev`).
  - Public exploit exists and affects our usage path.
  - Advisory severity is high/critical with feasible upgrade path.

### Current Decision
- Keep current toolchain versions and monitor advisories monthly.
- Avoid `npm audit fix --force` when it downgrades or destabilizes packaging/build stack.
