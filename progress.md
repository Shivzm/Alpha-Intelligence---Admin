# Admin API Implementation Progress

## Goal
Extract the API requirements from `Alpha_Intelligence_Complete_Project_Report.docx`, compare them with the existing backend and admin screens, classify APIs as required, redundant, or combinable, then implement and validate the appropriate flows.

## Progress

### 1. Locate and inspect the report — Complete
- Found `Alpha_Intelligence_Complete_Project_Report.docx` in the repository root and extracted its paragraphs and tables from the DOCX XML.
- The report specifies 168 endpoints across 11 groups: 41 User Portal endpoints and 127 public/admin/integration endpoints. Of the latter, 5 were marked existing and 122 planned. The group counts sum to 168.
- Extracted Sections 3.5–3.15, the extended data dictionary, Firestore collection/index/access-rule plan, and Appendix D screen-to-API matrix.

### 2. Map existing API and UI flows — Complete
- Before implementation, backend had real admin authentication and a single `/api/admin/data` stub; `AdminContext` fetched only that bootstrap payload.
- Admin route families and the Admin UI are now wired; see implementation and remaining-work sections below for exact boundaries.
- The report's intended datastore is Cloud Firestore. The backend now has Firebase Admin SDK integration and a Firestore adapter, but no service-account credentials are present in this workspace.
- The report expects student authentication through Firebase ID tokens, but the User Portal source is not in this workspace and the backend has no Firebase Admin credentials. Student API implementation and end-to-end identity sync therefore require project configuration and cross-repository coordination.

### 3. Implement prioritized API flows — Admin API implemented; provider-dependent operations explicitly gated
- Added the official `firebase-admin` dependency and a lazy Firestore adapter using `FIREBASE_SERVICE_ACCOUNT_JSON`; absent or malformed configuration returns a clear `503` instead of a fake empty response.
- Replaced `/api/admin/data` with bounded Firestore-backed reads, server-side summary counts, recent audit/application activity, and a secrets-free database status summary.
- Added shared paginated collection, field allowlisting, create/update/archive/delete, serialization, and audit helpers.
- Added authenticated CRUD for tasks, internships, records, stipends, intents, and certificate/ID-card templates. Internship applicant lists and record stipend ledgers reuse their canonical filtered collection queries.
- Added application/user list and detail APIs, application notes/history/export, user status, and single/bulk application decisions. Status mutations run in Firestore transactions and write application history, audit entries, and student notifications together.
- Added dashboard stats/activity, application analytics, funnel/domain summaries, telemetry, audit-log, inbox, alert/channel, enquiry, notification, and rule-based command routes.
- Added public internship listing, public counters, enquiry intake, and certificate verification; internal event ingestion is idempotent and protected by `x-internal-secret`; Firebase user-created/deleted sync endpoints are protected by the same middleware.
- Added the report's admin endpoint families from Tables 3.9–3.15, including paginated CRUD, exports, lifecycle operations, status histories, profile/settings, documents/templates, certificate requests, and sync. Method-level audit removed 11 generic CRUD methods not in the resource contracts; 110 admin methods remain, including screen aliases.
- High-impact actions are not faked: backup/restore, PDF generation/reissue, external email/SMS tests, database credential writes, multi-admin mutations, certificate approval, and cleanup jobs return explicit unavailable/unsupported errors until their backing services and policies exist.
- Added a request-ID error envelope and explicit provider/configuration errors; unavailable email/SMS delivery and unsupported AI actions are not reported as successful.
- Verified route registration, application lifecycle validation, command matching, and the Firestore-missing `503` response. No Firebase service-account credentials are available locally, so live Firestore reads/writes cannot yet be exercised.

## Remaining Endpoint Work and Boundaries

- Admin route paths exist for provider-dependent operations, but the following cannot execute until configured: Cloud Storage bucket and PDF renderer for document generation/downloads; managed Firestore exports and job runner/retention rules for backups; email/SMS provider for external delivery; Firebase account model and authorization roles for multi-admin; deployment-only environment writes for database settings.
- The 41 student-only endpoints in Tables 3.6–3.8 are not implemented. They require Firebase ID-token verification, the User Portal's actual schema/contracts, Firebase Admin credentials, and coordination with the separate User Portal repository. The listed Firebase webhooks and internal jobs are present, but not the student-facing session/profile/application/stipend/certificate/notification API families.
- Admin auth routes still need the report's reset-password completion, refresh, and change-password semantics; current logout clears the browser cookie but does not revoke a stolen token server-side. Email delivery and a revocation store are prerequisites for completing those semantics safely.
- App-facing admin coverage is wired for current screens. The report's required new screens were added: Internship Postings, Stipends & Broadcasts, and Operations Inbox.

### 4. Connect admin screens — Complete for implemented/configured flows
- Applications now use single/bulk backend status decisions with mandatory reasons; fake client-side record creation was removed.
- Manage Records uses the lifecycle status API.
- Active Tasks creates and deletes persisted tasks; simulated progress generation was removed.
- System Alerts persists alert channel settings and resolves stored alerts.
- NLP Keyword Mapping persists create/delete and keyword edits; command matching is a backend dry-run.
- Command Input records commands server-side and requires confirmation before one of the explicit supported actions executes.
- Document Vault uses signed download URLs and persisted revocation; fake export controls were removed where the report defines no export endpoint.
- Profile Settings reads and writes the signed-in administrator's profile.
- Database Config uses the backend health endpoint and no longer accepts or displays database credentials.
- System Backups reads backup/schedule metadata and calls real backup actions; unavailable provider actions surface errors instead of fabricated progress.
- Admin Management shows the configured single admin and read-only permission capability; provisioning and role changes are disabled until multi-admin auth exists.
- Main Overview, System Analytics, Model Telemetry, Engine Performance, and Audit Trails now display stored or measured values only; synthetic metrics and fabricated uptime/CPU/GPU/model-accuracy values are removed.
- Added protected sidebar/routes and working API forms for the new Internship Postings, Stipends & Broadcasts, and Operations Inbox screens.

### 5. Validation — Complete for local checks
- Frontend production build passes after all screen integrations.
- Backend `npm test` passes 10 Node tests covering route registration, JSON 404s, auth/CORS, missing Firestore config, internal auth, lifecycle validation, field allowlists, intent matching, and timestamp serialization.
- Frontend `npm run build` passes. Editor diagnostics report Tailwind utility modernization suggestions on existing class names; they do not fail the production build.
- Firebase CRUD and transaction happy paths remain unverified because no service-account key or Firestore emulator is configured in the workspace.

## API Audit and Consolidation Decisions

- Keep `/api/admin/data` as a bounded bootstrap/compatibility contract while granular screen endpoints serve filterable/paginated data.
- List/detail filters use shared services. `/api/admin/internships/:id/applications` and `/api/admin/applications?internshipId=...` share one query implementation.
- `/api/admin/records/:id/stipend` is retained as the report's convenience alias for `/api/admin/stipends?recordId=...`; both use the same paginated ledger query.
- Inbox unread count is a lightweight query over the same inbox collection/service as `/api/admin/inbox`.
- Lifecycle mutations for applications, internships, and records are named operations so generic update payloads cannot bypass rules; bulk application decisions reuse the lifecycle service.
- Keep separate user and admin route families and token middleware. They have different data visibility and must not be merged into one auth policy.
- Treat database credentials as deployment configuration, never as writable application settings. A UI “test connection” can report configured service health, but must not persist or reveal secrets.
- Backups/restores, email/SMS delivery, PDF generation, and multi-admin invitations depend on storage/provider setup and explicit destructive-operation rules; do not return fake success while those dependencies are absent.
- Use one shared CSV serializer for application, record, and audit exports; it quotes fields and neutralizes spreadsheet-formula prefixes.
- Use named state-transition operations for application, internship, and intern-record status changes; generic update payloads cannot bypass those transition rules.

## Infrastructure Prerequisites

- Firestore project/database and Firebase Admin credentials, supplied to the backend as a Vercel environment variable (never committed or written to this file).
- Storage bucket configuration for résumé/document uploads, downloads, and backups.
- Firebase Admin verification configuration for User Portal ID tokens; the other frontend/repository must call the shared API and lock down direct Firestore writes before student data is trusted.
- Optional delivery-provider credentials for email/SMS and a scheduled-job secret/cron configuration for backup and cleanup jobs.
- Configure `FIREBASE_SERVICE_ACCOUNT_JSON` in backend Vercel environment variables (do not send or commit the value), plus `FIREBASE_STORAGE_BUCKET` for storage-backed work. Until configured, Firestore-backed endpoints correctly return `503 FIREBASE_NOT_CONFIGURED`.

## End-to-End Flow and Status

1. **Extract requirements — Done:** Read the report's API names, methods, payloads, data model, lifecycle, and screen matrix.
2. **Inventory current code — Done:** Mapped existing routes, authentication, bootstrap response, and AdminContext consumers.
3. **Classify/consolidate — Done for Admin APIs:** Reused list/detail queries and CSV serialization, retained named lifecycle endpoints, and removed 11 unnecessary generic route methods.
4. **Define contracts — Done for implemented routes:** Added validation allowlists, authentication boundaries, request IDs, standard errors, and explicit provider errors.
5. **Implement backend — Done for public/admin/internal route families, with documented gates:** Firestore is the persistence adapter; provider-dependent work fails explicitly until configured.
6. **Wire Admin UI — Done:** Current screens and the three new operations screens call APIs with loading, empty, confirmation, and error states.
7. **Validate — Done locally:** Backend `npm test` passes 10/10 and the frontend production build passes. Live Firestore CRUD/transactions remain untested without service credentials/emulator.
8. **Update this file — Done for this implementation pass:** Remaining external configuration and cross-repository work is listed below.

## Remaining Work
- Configure Firebase Admin credentials and a Firestore project in Vercel, then run the Firestore CRUD/transaction flows against an emulator or non-production project.
- Coordinate the 41 User Portal APIs and auth lifecycle endpoints with the separate User Portal repository before claiming the full 168-endpoint platform is complete.
- Configure Storage/PDF, backup destination and scheduled jobs, external message delivery, and decide whether to implement multi-admin roles; then enable the corresponding currently gated operations.
