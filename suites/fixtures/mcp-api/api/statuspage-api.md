# Statuspage-ish internal API (v2) — notes for whoever wraps this

Base URL: `https://status.internal.example/api/v2`
Auth: `Authorization: Bearer <token>` on every request.

## GET /incidents
Query: `status` (one of `investigating`, `identified`, `monitoring`,
`resolved`), `limit` (default 25, max 100), `cursor` (opaque string).
Returns `{ "incidents": [Incident], "next_cursor": string | null }`.

## GET /incidents/{id}
Returns a single `Incident`. 404 if unknown.

## POST /incidents
Body: `{ "title": string, "status": string, "body": string,
"component_ids": string[] }`. Returns the created `Incident`.

## PATCH /incidents/{id}
Body: any subset of `{ "status", "body" }`. Returns the updated `Incident`.

## GET /components
Returns `{ "components": [Component] }`. No pagination.

### Incident
`{ "id": string, "title": string, "status": string, "created_at":
ISO-8601 string, "updated_at": ISO-8601 string, "component_ids":
string[], "body": string }`

### Component
`{ "id": string, "name": string, "status": "operational" | "degraded" |
"partial_outage" | "major_outage" }`

## Errors
Non-2xx returns `{ "error": { "code": string, "message": string } }`.
`429` includes a `Retry-After` header in seconds.
