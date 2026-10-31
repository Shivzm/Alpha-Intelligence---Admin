# Alpha Intelligence Admin

The repository contains a Vite/React admin console in `frontend/` and its
CommonJS Express API in `server/`. The API uses an HTTP-only admin session
cookie and Firestore-backed admin endpoints. Configure `VITE_API_URL` with the
API origin (for example `http://localhost:3000`, without `/api`) and set the
server's `FRONTEND_URL` to the frontend origin.

## Local NLP

The deterministic, offline NLP modules are isolated under `server/src/nlp/`.
Authenticated admins can call `GET /api/admin/ai/actions` and the matching
`POST /api/admin/ai/:action` routes. Inputs are validated and rate-limited.
These routes return advisory results only: search creates a query plan and
does not query Firestore, and no NLP route mutates data.

The command screen continues to use the existing `/api/admin/commands`
contract. It shows an NLP preview separately from the configured command
match. A pending action still requires explicit confirmation. Confirmation
and cancellation claim pending commands transactionally; a failed action is
marked failed and audited rather than being automatically retried. A command
left in `processing` after a server crash requires manual reconciliation.

The student panel at
<https://internshipmanagement-userpannel.vercel.app/> is a separate
Create React App deployment. It retains Firebase client authentication and
calls `/api/student/...` with a Firebase ID token; the API verifies that token
server-side and scopes profile, application, stipend, certificate, and
notification reads to the verified student UID. Admin routes continue to use
the separate HTTP-only admin cookie. The Firebase web app and server service
account must belong to the same Firebase project. Configure the student app's
`REACT_APP_API_URL` with the server origin, and include both production
frontend origins in the server's comma-separated `FRONTEND_URL`.

The public internship list is served by `GET /api/public/internships`.
Application submissions are validated and deduplicated transactionally; they
create an application, an admin inbox item, and an audit record. Student
profile and application text is not logged. Certificate endpoints currently
return metadata only; private file delivery and student notification
acknowledgment remain future work.

The separate demo backend folder has been removed. The active deterministic
NLP implementation is under `server/src/nlp/`; its modules use only Node.js
built-ins and other local NLP modules, so no demo-only dependencies are needed
by the canonical server.

## Checks

From `server/`, run `npm test`. From `frontend/`, run `npm run lint` and
`npm run build`. From the student panel repository, run `npm test -- --watchAll=false`
and `npm run build`.