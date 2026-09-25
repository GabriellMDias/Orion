# Living Documentation

[Documentation index](../README.md) · [Implementation plan](../implementation-plan.md#phase-11) · [Contributing](../contributing.md)

Orion's foundation includes a navigable human interface for the current API, database/data dictionary, and frontend components. The interface presents derived facts; it does not replace the canonical schemas, metadata, source, ADRs, or machine-readable generated artifacts. This responsibility is part of the foundation, not a deployment-specific extra.

## Sources and representations

| Subject | Canonical source | Existing or required derived representation |
| --- | --- | --- |
| API operations, requests, responses, and expected errors | Executable TypeBox wire contracts, route metadata, and the API error registry | Committed [OpenAPI 3.1](../generated/api/openapi.json) and [error reference](../generated/api/errors.md); Phase 11 presents them in the portal. The SDK remains a separate generated consumer. |
| Database structure and data dictionary | Migrated PostgreSQL, reviewed SQL migrations, and [schema-adjacent semantic metadata](../../apps/api/prisma/schema-metadata.json) | Committed [physical and semantic reference](../generated/database/approval-requests.md); Phase 11 presents tables, columns, constraints, ownership, classification, null semantics, and lifecycle where recorded. Never infer missing meaning from names. |
| Frontend components | The actual web component source and component-owned examples/metadata added with the components | Phase 11 establishes a reproducible, AI-readable component reference and human-facing examples for components that exist. It must distinguish component API, states, accessibility behavior, and usage constraints from application-specific workflow prose. |
| Configuration | API TypeBox schema and [reference metadata](../../apps/api/src/config.ts) | [Generated safe configuration reference](../generated/configuration/api.md) and the mechanically checked [local example](../../.env.example); never publish secret values. |

Authored documentation owns intent, invariants, operational procedures, and rationale that cannot be reliably generated. Derived structural facts have one source and may be rendered in several forms. The portal should link back to canonical sources and relevant policy instead of maintaining independent narrative copies. ADRs retain decision history; the portal shows current behavior.

## Portal requirements and boundary

Phase 11 must provide a discoverable entry from the repository README and documentation index, navigation among API, data dictionary, and component documentation, and stable links to the underlying AI-readable artifacts. Human pages must remain usable without reading raw JSON or source files. Generated output must be deterministic, safe to publish from tracked repository data, and freshness-checked by `pnpm validate`/CI. A clean checkout must be able to regenerate or check it through documented commands. Broken local links and undocumented application-owned schema objects must fail validation.

Do not copy real environment values, production data, tokens, or unrestricted examples into generated pages. Preserve the API's server/client configuration boundary and database classification. A portal renderer may transform the existing artifacts, but it must not become the source for API, database, or component semantics. Choose and justify any new portal or component-documentation dependency during Phase 11 against existing ADRs and the [ADR policy](../adr/authoring.md); this document does not select a framework.

## Change workflow

1. Change the owning source and its meaningful tests. Add component examples/metadata beside the owning component when needed.
2. Regenerate derived files through their owners. Review the diff for loss of meaning, sensitive content, and unexpected changes.
3. Check artifact freshness, links, portal rendering/navigation, and browser-visible examples at the applicable boundary. Update this index and [validation availability](../validation.md) when Phase 11 commands exist.

The current repository has generated API, error, configuration, and database references but no living documentation portal or generated component reference yet. [Phase 11](../implementation-plan.md#phase-11) owns those remaining foundation deliverables.
