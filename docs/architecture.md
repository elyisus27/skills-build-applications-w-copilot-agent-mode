# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep page rendering and UI state in the React frontend, with API calls centralized in the shared client. Use relative `/api` paths through the Vite proxy, and give each capability clear loading, empty, and accessible error states.
- Logic tier decision: Keep request validation, cross-model workflows, scoring, aggregation, and recommendation selection in Express routes/services. Return deliberate 4xx responses for invalid input, malformed IDs, missing references, and unknown users rather than exposing cast errors as 500s.
- Data tier decision: Define required fields, defaults, and relationships in Mongoose models. Keep persistence and seed data in the data tier; make seeding idempotent and additive so it preserves unrelated existing records.
- Activity tracking approach: Validate the activity type and positive minutes, verify that both submitted IDs are well-formed and reference existing records, then store the activity with its user and team references, computed points, and occurrence date. List persisted activities through the API.
- Team management approach: Require a non-empty name, retain the submitted name and mascot, and store member references using the model's members array. List persisted teams without moving team data handling into the frontend.
- Leaderboard approach: Aggregate activity points by team in the logic tier, order totals from highest to lowest, and return each team's name, total points, and 1-based rank.
- Workout suggestions approach: Find the requested user by email, consider their fitness goal and recent activity when selecting suggestions, and include a reason connecting the recommendation to that context. Return a deliberate 4xx response when no user matches.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — checks model requirements, defaults, relationships, and idempotent additive seeding. A failure indicates a data contract or seed regression. Current result: passed (5 tests).
- API command: `npm run test:api --prefix octofit-tracker/backend` — checks activity and team requests, leaderboard ranking, and user-specific workout suggestions. A failure indicates an API behavior, validation, or response-shape regression. Current result: passed (4 tests).
- Frontend command: `npm test --prefix octofit-tracker/frontend` — checks capability rendering, requested paths, and loading, empty, and accessible error states. A failure indicates a presentation or API-client integration regression. Current result: passed (15 tests).
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks backend TypeScript compilation. A failure indicates a type or compile error. Current result: passed.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks frontend TypeScript compilation and production bundling. A failure indicates a type, compile, or bundle error. Current result: passed.

Implement and verify in dependency order: data contracts and seeding first, API behavior second, and frontend rendering and states third. Rerun the affected test command after each tier, then run both builds and all three test commands for final verification.
