# Express API → Spring Boot migration

The old Express API (Node.js, Express 4, Mongoose 8) served accounts, roles,
inheritance claims and IPFS document uploads on port 5001 under `/api`. It was
deleted on 2 November 2026 and is being rewritten in this Spring Boot project.
This file records everything it did, what the frontend depends on, and how each
piece maps to Spring.

The old code is in git history:
`git log --diff-filter=D --oneline -- backend/routes`, then
`git show <commit>^:backend/routes/authroutes.js`.

## Overview

- **Base path:** every route sits under `/api`. `GET /ping` (no auth) returned
  `{ "msg": "Ping Successful" }`.
- **Response shape:** JSON with `success` (boolean) plus `data`, `token` or
  `message`. The frontend shows `message` on errors.
- **Auth:** `Authorization: Bearer <JWT>`; the user is reloaded from MongoDB on
  every request.
- **CORS:** origins from `CLIENT_URL`, credentials allowed, methods
  GET/POST/PUT/DELETE, headers `Content-Type` and `Authorization`.
- **Startup:** the process exited if MongoDB was unreachable.

| Variable | Used for | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `5001` |
| `MONGODB_URL` | MongoDB connection string (database `landrecords`) | required |
| `JWT_SECRET` | Signs and verifies tokens (HS256) | required |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` | none |
| `CLIENT_URL` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `PINATA_JWT` | Pinata API key for IPFS uploads | uploads return 503 without it |
| `PINATA_API_URL` | Alternative Pinata-compatible endpoint | `https://api.pinata.cloud` |

`application.yml` already maps `PORT` and `MONGODB_URL` and imports `backend/.env`.

## Endpoints

Access: **public** = no token; **user** = any logged-in, verified account;
**government** = verified account with role `government`.

| Method | Path | Access | Request | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | public | JSON: `name`, `email`, `password`, `role`, `aadhaarNumber`, `panNumber` | 201, token response, or `pendingApproval` for government |
| POST | `/api/auth/login` | public | JSON: `email`, `password` | 200, token response |
| GET | `/api/auth/me` | user | – | 200, `data`: the user document |
| GET | `/api/auth/pending-officials` | government | – | 200, `data`: `[{ _id, name, email, createdAt }]`, oldest first |
| PUT | `/api/auth/verify/:id` | government | – | 200, `data`: the approved user |
| POST | `/api/inheritance/claims` | user | JSON: `landId`, `parentName`, `certificateId`, `heirWallet`, `documentCid` | 201, `data`: the claim |
| GET | `/api/inheritance/claims/mine` | user | – | 200, `data`: caller's claims, newest first |
| GET | `/api/inheritance/claims?status=` | government | optional `status`: `pending` / `approved` / `rejected` | 200, `data`: claims with `claimant` as `{ _id, name, email }`, oldest first |
| PUT | `/api/inheritance/claims/:id/approve` | government | JSON: `txHash` | 200, `data`: the claim |
| PUT | `/api/inheritance/claims/:id/reject` | government | JSON: optional `note` | 200, `data`: the claim |
| POST | `/api/documents` | user | multipart: `document` file, `kind` | 201, `data`: `{ cid }` |

Token response (register and login):

```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "<ObjectId>", "name": "...", "email": "...", "role": "buyer", "isVerified": true }
}
```

Errors from every protected route:

| Status | `message` | When |
| --- | --- | --- |
| 401 | `Not authorized to access this route` | No token, bad or expired token, user deleted, user not verified |
| 403 | `User role <role> is not authorized to access this route` | Role check failed |

### Auth

**`POST /api/auth/register`** checks, in order:

| Status | `message` | Check |
| --- | --- | --- |
| 400 | `All fields (name, email, password, role, aadhaarNumber, panNumber) are required` | Any field missing |
| 400 | `Invalid role` | Role not `landowner`, `buyer` or `government` |
| 400 | `Password must be at least 6 characters` | Password length |
| 400 | `Invalid Aadhaar number` | Trimmed value is not exactly 12 digits |
| 400 | `Invalid PAN number` | Trimmed, uppercased value doesn't match `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| 400 | `User already exists` | Email already registered |
| 400 | `Duplicate email or Aadhaar number` | Unique-index violation (email, Aadhaar or PAN) |

- `landowner` and `buyer` accounts are created verified and get the token response.
- `government` accounts are created unverified and get no token:
  `{ "success": true, "pendingApproval": true, "message": "Account created. A government official must approve it before you can log in." }`.
- The Aadhaar and PAN checks are mocks that only check the format.

**`POST /api/auth/login`**: 400 `Please provide an email and password`;
401 `Invalid credentials` (unknown email or wrong password); 401
`Your account is pending verification` (unapproved government account).

**`GET /api/auth/me`** returns the full user document (`_id`, `name`, `email`,
`role`, `aadhaarNumber`, `panNumber`, `isVerified`, `createdAt`, `__v`), never
the password. The frontend calls it on page load to restore the session.

**`PUT /api/auth/verify/:id`**: 404 `User not found`; 400
`Only government official accounts need verification`; otherwise sets
`isVerified = true`.

### Inheritance claims

**`POST /api/inheritance/claims`** checks, in order:

| Status | `message` | Check |
| --- | --- | --- |
| 400 | `landId, parentName, certificateId, heirWallet and documentCid are required` | Any field missing |
| 400 | `Invalid document CID` | `documentCid` fails the CID pattern (see Documents) |
| 400 | `Invalid death certificate or parent information` | No certificate with this ID (exact, trimmed) and parent name (case-insensitive) |
| 403 | `Your account name does not match the heir on this certificate` | Caller's `name` ≠ certificate's heir (case-insensitive, trimmed) |
| 400 | `There is already a pending claim for this land` | A `pending` claim exists for `landId` |
| 400 | Mongoose validation message | `heirWallet` not `0x` + 40 hex chars, or `landId` < 1 |

The stored `parentName`, `certificateId` and `heirName` come from the
certificate record, not the request. `claimant` is the caller.

**Approve flow:** the official's browser first calls the contract's
`transferOwnership` from their wallet, then sends the transaction hash here.
`approve` requires `txHash` matching `^0x[a-fA-F0-9]{64}$` (else 400
`A valid transfer transaction hash is required`). Both `approve` and `reject`
return 404 `Claim not found`, or 400 `Claim is already <status>` if it isn't
`pending`. They set `status`, `reviewedBy` (the official), and `txHash` or
`reviewNote`.

### Documents

**`POST /api/documents`** pins a land document to IPFS through Pinata. The file
stays in memory and is never written to disk.

- Multipart field `document`: PDF, PNG or JPEG (by declared MIME type), at most 10 MB.
- Multipart field `kind`: `deed`, `transfer-deed` or `heir-document` (default `deed`).

| Status | `message` | When |
| --- | --- | --- |
| 503 | `Document storage (IPFS) is not configured` | `PINATA_JWT` unset |
| 400 | `Document must be 10 MB or smaller` | File too large |
| 400 | `Upload a PDF, PNG or JPEG document` | Wrong type |
| 400 | `Please attach a document` | No file |
| 502 | `Could not store the document on IPFS` | Pinata call failed |

Pinata call: `POST {PINATA_API_URL}/pinning/pinFileToIPFS` with header
`Authorization: Bearer {PINATA_JWT}` and multipart body:

- `file`: the bytes, original filename and content type
- `pinataMetadata`: `{"name": "<filename>", "keyvalues": {"kind": "<kind>", "uploadedBy": "<user id>"}}`
- `pinataOptions`: `{"cidVersion": 1}`

The CID is the `IpfsHash` field of the response. CIDs are validated with
`^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{50,})$` (CIDv0 or base32 CIDv1).

## Data models

Database `landrecords`. Mongoose names the collections `users` and
`inheritanceclaims`; the Spring documents must use the same names to read
existing data.

**`users`**

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | |
| `name` | string | required, trimmed |
| `email` | string | required, unique index, email regex |
| `password` | string | required, bcrypt hash (cost 10), never returned |
| `role` | string | `landowner` / `buyer` / `government`, default `buyer` |
| `aadhaarNumber` | string | required, unique index, exactly 12 characters |
| `panNumber` | string | required, unique index, exactly 10 characters, stored uppercase |
| `isVerified` | boolean | default `false`; only unapproved government accounts are `false` |
| `createdAt` | date | default now |
| `__v` | number | Mongoose version key; ignore |

**`inheritanceclaims`**

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | |
| `landId` | number | required, ≥ 1; the on-chain land ID |
| `parentName` | string | required, from the certificate |
| `certificateId` | string | required |
| `heirName` | string | required, from the certificate |
| `heirWallet` | string | required, `^0x[a-fA-F0-9]{40}$`; receives the land |
| `documentCid` | string | required; supporting document, becomes the land's current document on approval |
| `claimant` | ObjectId → `users` | required |
| `status` | string | `pending` / `approved` / `rejected`, default `pending` |
| `txHash` | string | set on approve |
| `reviewedBy` | ObjectId → `users` | set on approve or reject |
| `reviewNote` | string | set on reject |
| `createdAt`, `updatedAt` | date | Mongoose timestamps |

The same database also holds `verified_properties`, written directly by
`services/fraud-detection`. It isn't part of this API.

## Mock death-certificate registry

Claims are checked against this list, which lived in
`backend/data/deathCertificates.json` on the server so the browser couldn't
read or edit it. Port it to `src/main/resources/data/deathCertificates.json`.

| `certificateId` | `parent` | `heir` |
| --- | --- | --- |
| DC001 | John Doe | Jane Doe |
| DC002 | Alice Smith | Bob Smith |
| DC003 | Michael Brown | Sarah Brown |
| DC004 | Emma Johnson | Liam Johnson |
| DC005 | Olivia Davis | Noah Davis |
| DC006 | William Wilson | Sophia Wilson |
| DC007 | John | rush |
| DC008 | Komal Singh | Aaryan |
| DC009 | Komal | Aditya |

## Approving the first official

`npm run approve-official -- <email>` found the user by email and, if their role
was `government`, set `isVerified = true`. It bootstraps the first official,
since later approvals come from existing officials. Until a Spring
replacement exists, use mongosh:

```js
db.users.updateOne({ email: "official@example.gov", role: "government" }, { $set: { isVerified: true } })
```

## Express → Spring Boot mapping

| Express | Spring Boot |
| --- | --- |
| `app.js` (express, `cors`, JSON body parsing) | `AcreVaultApiApplication`; CORS through `SecurityFilterChain.cors()` with a `CorsConfigurationSource` built from `CLIENT_URL` |
| `mongoose.connect` | `spring.mongodb.uri` (already configured) |
| `models/usermodel.js` | `User` with `@Document("users")` + `UserRepository extends MongoRepository<User, String>` |
| `models/inheritanceClaimModel.js` | `InheritanceClaim` with `@Document("inheritanceclaims")` + repository; `@EnableMongoAuditing` for `createdAt` / `updatedAt` |
| `jsonwebtoken` `sign` | `JwtEncoder` (`NimbusJwtEncoder` with `ImmutableSecret`), HS256, claims `id` and `role` |
| `middleware/auth.js` `protect` | OAuth2 resource server: `NimbusJwtDecoder.withSecretKey(...)` + a converter that loads the user and rejects missing or unverified accounts |
| `authorize('government')` | `.requestMatchers(...).hasRole("GOVERNMENT")` or `@PreAuthorize` |
| `bcrypt` | `BCryptPasswordEncoder(10)` |
| Manual checks in controllers | Request records with Jakarta Bean Validation (`@NotBlank`, `@Pattern`, `@Size`, `@Min`) |
| `{ success, message }` errors | `@RestControllerAdvice` + custom `AuthenticationEntryPoint` and `AccessDeniedHandler` |
| `multer` (memory, 10 MB) | `MultipartFile`; limits already set in `application.yml` |
| `utils/ipfs.js` (`fetch`) | `RestClient` + `MultipartBodyBuilder` |
| `utils/mockverification.js` | A small `IdentityVerifier` service (same format checks) |
| `data/deathCertificates.json` | Resource file loaded once with Jackson |
| `scripts/approveOfficial.js` | `ApplicationRunner` enabled by a command-line flag or profile |
| `GET /ping` | A one-line controller (or point clients at `/actuator/health`) |
| `node-cron` | Imported but unused; nothing to port |

Suggested layout under `com.acrevault.api`:

```
config/       SecurityConfig, JwtConfig, AppProperties (@ConfigurationProperties)
common/       ApiResponse, GlobalExceptionHandler
auth/         AuthController, AuthService, User, Role, UserRepository, request/response records
inheritance/  InheritanceController, InheritanceService, InheritanceClaim, ClaimStatus,
              InheritanceClaimRepository, DeathCertificateRegistry
documents/    DocumentController, PinataClient
```

## Keeping the frontend working

The frontend (`frontend/src/utils/api.jsx`, `context/Authcontext.jsx`) should
need no changes if these hold:

- **Same paths and port:** `VITE_API_URL=http://localhost:5001/api`.
- **Same JSON keys:** `success`, `message`, `data`, `token`, `user`, `pendingApproval`.
- **Ids:** claims, pending officials, `/auth/me` and populated `claimant` use
  `_id` (the frontend reads `claim._id`, `official._id`, `user._id`). The
  `user` object in the token response uses `id`. Add `@JsonProperty("_id")`
  on response records, or change both sides together.
- **Existing data:** keep the collection names, and store `claimant` and
  `reviewedBy` as ObjectIds (`@Field(targetType = FieldType.OBJECT_ID)`).
- **Existing passwords:** `BCryptPasswordEncoder` accepts the `$2b$` hashes
  bcrypt wrote, so current accounts can still log in.
- **JWT secret:** Nimbus requires at least 32 bytes for HS256; a short secret
  such as `change-me` fails at startup. With the same long secret and the `id` /
  `role` claims, tokens issued by Express stay valid.
- **`JWT_EXPIRE`:** `7d` binds directly to `java.time.Duration`.
- **Security defaults:** Spring Security's own 401/403 bodies and the default
  login page must be replaced (stateless sessions, CSRF off, JSON errors).
- **Upload errors:** Spring throws `MaxUploadSizeExceededException` for large
  files; map it to the same 400 message.

## Express bugs not to copy

- Register returned 500 for Mongoose validation errors such as a malformed email; should be 400.
- A duplicate PAN reported `Duplicate email or Aadhaar number`.
- Email uniqueness was case-sensitive, so `User@x.com` and `user@x.com` could both register.
- An invalid ObjectId in `:id` paths returned 500 instead of 404.
- Several 500 responses included `error.message`, leaking internals.
- `/auth/me` returned Aadhaar and PAN numbers; return only what the frontend uses.
- The "one pending claim per land" check wasn't atomic. Use a partial unique
  index on `landId` where `status = "pending"`.
- Approve trusted the `txHash` format only. Optionally confirm the transfer on-chain (e.g. with web3j).
- Upload type checks trusted the client's MIME type. Sniff file contents if it matters.
- `pages/my_properties.jsx` calls `GET /api/properties`, which never existed.
  Add it, or read owned land from the contract.

## Checklist

- [ ] `AppProperties`: JWT secret and expiry, CORS origins, Pinata URL and JWT
- [ ] `ApiResponse` and `GlobalExceptionHandler` with the error messages above
- [ ] `SecurityFilterChain`: stateless, CSRF off, CORS, public `register` / `login` / `ping` / health
- [ ] JWT encoder and decoder, user-loading converter, `BCryptPasswordEncoder`
- [ ] Auth: `User`, repository, register, login, me, pending officials, verify
- [ ] Inheritance: `InheritanceClaim`, repository, death-certificate registry, five endpoints
- [ ] Documents: `PinataClient`, upload endpoint
- [ ] `GET /ping`
- [ ] Approve-official command
- [ ] Tests: `@WebMvcTest` per controller, `@DataMongoTest` for repositories, one Testcontainers end-to-end flow
- [ ] Smoke-test from the frontend: register → login → upload → claim → approve
