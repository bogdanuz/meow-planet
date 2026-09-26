---
name: docs-sync
description: >-
  When to update which docs in meow-planet after code or product changes. Use after
  tasks to avoid stale or duplicate SSOT.
---

# Docs sync

## Do not update «на автомате»

Change a doc only if **truth in that doc** changed.

| Document | Update when |
|---|---|
| `docs/05-CURRENT-STATE.md` | Sprint milestone, version, open/done items |
| `docs/04-DECISION-REGISTER.md` | Owner decision via AskQuestion or explicit fix |
| `CHANGELOG.md` | User-visible or notable release change |
| `HANDOFF.md` | Next chat handoff / current step |
| `Планета_Мяу_Идея_продукта.md` | Product idea change (owner-approved) |
| `docs/product/PRODUCT_CONSTRAINTS.md` | MVP constraint change |
| `docs/architecture/ARCHITECTURE.md` | Durable architecture change → prefer **ADR** in `docs/adr/` |
| `THIRD_PARTY_NOTICES.md` | New dependency, font, audio, image, copied code |
| Chat history | **Never** SSOT |

## ADR

Long-lived architectural choice → new file `docs/adr/NNNN-short-title.md` from template in `docs/adr/README.md`.

## Agent config

Upstream skill inspirations → `docs/quality/AGENT-CONFIG-SOURCES.md`.
