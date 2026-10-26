# Deployment Checklist — Kultworks Immigration Backend

## Pre-flight

- Copy `.env.example` to `.env` and fill in all values
- Run `npm install`
- Confirm MongoDB Atlas connection string in `MONGO_URI` is correct and the IP is whitelisted
- `JWT_SECRET` must match the master backend's `JWT_SECRET` exactly — this service only verifies, never signs staff tokens
- `PORTAL_TOKEN_SECRET` should be a randomly generated 32-byte hex string (unique to this service)
- `S2S_SECRET` must match the master backend's `S2S_SECRET` exactly
- Set `CORS_ORIGIN` to the frontend origin(s) for the target environment
- Create the `uploads/` directory (or set `UPLOAD_DIR` to a writable path)

## First run

- Run `npm start` and confirm the server starts without "Missing required env var" errors
- Hit `GET /health` — expect `200 OK`
- Hit `GET /{nodeEnv}/test` — expect the environment name in the response

## Seed master data

Seed the following collections via `POST /{nodeEnv}/{collection}` with a staff JWT:

- `VisaType` — add active visa categories (H-1B, L-1A, EB-2, O-1, TN, etc.)
- `CaseStage` — add workflow stages with `order` and `nextStages` for each visa type
- `DocType` — add document type definitions with `acceptedFormats` and `expiryTracked` flags

## S2S sync

- Confirm the master backend is configured to send `POST /{nodeEnv}/sync-user` and `POST /{nodeEnv}/sync-org` with the `x-internal-secret` header on user/org create and update events
- Test with a manual POST to `sync-user` — expect `{ "success": true }`

## Portal onboarding

- Create a Beneficiary record via `POST /{nodeEnv}/Beneficiary`
- Send an invite to the beneficiary by `PATCH /{nodeEnv}/Beneficiary/{id}` to set `isPortalActive: true` and create a `PortalUser` with an `inviteToken` (staff tooling — BE-43+)
- Beneficiary accepts the invite via `POST /{nodeEnv}/portalauthentication/register`
- Beneficiary logs in via `POST /{nodeEnv}/portalauthentication/login` and confirms a JWT is returned

## Smoke test

- `POST /{nodeEnv}/Petitioner` — create a petitioner
- `POST /{nodeEnv}/immigrationcases/initiate` — create a case, confirm `caseNumber` is `CASE-YYYY-NNNNN`
- `PATCH /{nodeEnv}/immigrationcases/update-status` — transition status, confirm timeline entry created
- `GET /{nodeEnv}/dashboard/summary` — confirm counts are returned
- `GET /{nodeEnv}/ImmigrationCase?search=CASE` — confirm text search returns results
