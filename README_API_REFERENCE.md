# API Reference (Backend)

This repo exposes an Express API under the base URL:

- Base: `http://localhost:5000/api`

## Auth

### `POST /auth/login`
Purpose: Login and receive a (dummy) token + user payload.

Body:
- `email` (string, required)
- `password` (string, required)

Response:
- `{ success, token, user }` on success

Test credentials (temporary):
- `admin@test.com` / `123456`
- `guard@test.com` / `123456`
- `resident@test.com` / `123456`

---

## Users (`/users`)

### `GET /users`
Purpose: List active users.

Query:
- `societyId` (number, optional) → filter by `users.society_id`

---

### `GET /users/:id/flats`
Purpose: Get a user’s flat mappings (from `user_flat_mapping`).

Path:
- `:id` (number, required) → `user_id`

---

### `POST /users`
Purpose: Create an app/management user.

Body (common):
- `full_name` (string, required)
- `email_id` (string, required)
- `mobile_number` (string, required, 10 digits)
- `gender` (string, optional)
- `account_type` (string, optional; ex: `app`, `management`)
- `user_type` (string, required; role name)
- `os_type` (string, optional)
- `password_hash` (string, required in current implementation)
- `society_id` (number, optional)
- `flat_mappings` (array, optional) → `{ flat_id, ownership_type: "Owner"|"Tenant" }`

---

### `PUT /users/:id`
Purpose: Update a user.

Path:
- `:id` (number, required)

Body:
- Same shape as create.

---

### `DELETE /users/:id`
Purpose: Soft delete / deactivate a user (implementation-specific).

Path:
- `:id` (number, required)

---

### `GET /users/stats`
Purpose: Return user statistics (implementation-specific).

---

## Societies (`/societies`)

### `GET /societies`
Purpose: List active societies (`is_active=1`).

Query:
- `search` (string, optional) → matches name/address/city

---

### `POST /societies`
Purpose: Create a society.

Body (required):
- `society_name` (string)
- `city` (string)
- `contact_number` (string)

Body (optional):
- `state`, `country`, `pincode`, `contact_email`, `address`, `google_map_url`, `latitude`, `longitude`

---

### `PUT /societies/:id`
Purpose: Update a society.

Path:
- `:id` (number, required)

Body:
- Same shape as create.

---

### `DELETE /societies/:id`
Purpose: Deactivate a society (`is_active=0`).

Path:
- `:id` (number, required)

---

### `GET /societies/:id/towers`
Purpose: List towers for a society.

Path:
- `:id` (number, required) → `society_id`

---

### `POST /societies/towers/bulk`
Purpose: Sync tower names list for a society (insert missing, delete removed).

Body:
- `society_id` (number, required)
- `towers` (string[], required) → tower names

---

### `DELETE /societies/towers/:towerId`
Purpose: Delete a tower by id (cascades floors/flats via FK rules, if configured).

Path:
- `:towerId` (number, required)

---

### `POST /societies/units/generate`
Purpose: Generate floors/flats for towers.

Body:
- `configs` (array, required) → supports both `floors[]` mode and `total_floors/units_per_floor` mode

---

### `GET /societies/:id/configs`
Purpose: Fetch stored configs for a society (tower/floor/unit summary).

Path:
- `:id` (number, required) → `society_id`

---

## Flats (`/flats`)

### `GET /flats/assigned`
Purpose: Get flat ids that are already assigned.

Query:
- `societyId` (number, required)

---

### `POST /flats/generate`
Purpose: Generate flats for floors (and optional merged sets).

Body:
- `floor_ids` (number[], required)
- `units_per_floor` (number, required)
- `unit_types` (string[], optional)
- `starting_number` (number, optional)
- `merged_units` (array, optional)

---

### `GET /flats/society/:societyId`
Purpose: List flats for a society (includes tower/floor info).

Path:
- `:societyId` (number, required)

---

### `GET /flats/:flatId`
Purpose: Fetch a flat by id.

Path:
- `:flatId` (number, required)

---

### `POST /flats/update-structure`
Purpose: Update a floor’s flat structure (supports multiple payload shapes).

Body:
- Varies (see `backend/controllers/flatsController.js`)

---

### `PUT /flats/unit-types/bulk`
Purpose: Bulk update `unit_type` for flats.

Body:
- `updates` (array, required) → `{ flat_id, unit_type }`

---

## Units (`/units`)

### `POST /units/merge`
Purpose: Merge multiple flats into a single merged unit row (e.g. `101+102`).

Body:
- `flat_ids` (number[], required; min 2; must be on same floor)

---

### `POST /units/unmerge`
Purpose: Unmerge a previously merged unit.

Body:
- (see `backend/controllers/unit/unitMergeController.js`)

---

## Import

### `POST /import-units`
Purpose: Import units via CSV/XLSX.

Form-data:
- `file` (required) → uploaded via multer

---

## Society Admins (`/society-admins`)

### `GET /society-admins`
Purpose: List society admins.

---

### `POST /society-admins`
Purpose: Create a society admin.

Body:
- `society_admin_name` (string, required)
- `society_id` (number, required)
- `email` (string, required)
- `phone` (string, required, 10 digits)
- `password_hash` (string, required)

---

### `PUT /society-admins/:id`
Purpose: Update a society admin.

Path:
- `:id` (number, required)

---

### `DELETE /society-admins/:id`
Purpose: Delete/deactivate a society admin.

Path:
- `:id` (number, required)

---

## Dashboard (`/dashboard`)

### `GET /dashboard/stats`
Purpose: Aggregate counts used by the dashboard.

---

## Settings (`/settings`)

### `GET /settings`
Purpose: Get app settings (roles + restrictions).

---

### `PUT /settings`
Purpose: Update app settings (roles + restrictions).

Body:
- `{ roles: [...], restrictions: {...} }`

---

### `GET /settings/roles`
Purpose: List roles only.

---

## Visitor Management (MVP)

Visitor APIs are documented in:
- `README_VISITOR_MANAGEMENT.md`


# Society Management System - API Reference

Backend base URL:
- `http://localhost:5000/api`

Frontend (test pages):
- Guard Visitors: `http://localhost:3000/guard/visitors`
- Resident Visitors: `http://localhost:3000/resident/visitors`

## Auth

### `POST /auth/login`
Purpose: Login and receive a (dummy) token + user payload.

Body:
- `email` (string, required)
- `password` (string, required)

Response:
- `{ success, token, user }` on success

Test credentials (temporary):
- `admin@test.com` / `123456`
- `guard@test.com` / `123456`
- `resident@test.com` / `123456`

Example:
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"guard@test.com\",\"password\":\"123456\"}"
```

---

## Users (`/users`)

### `GET /users`
Purpose: List active users.

Query:
- `societyId` (number, optional) -> filter by `users.society_id`

Example:
```bash
curl "http://localhost:5000/api/users?societyId=108"
```

---

### `GET /users/:id/flats`
Purpose: Get a user's flat mappings (from `user_flat_mapping`).

Path:
- `:id` (number, required) -> `user_id`

Example:
```bash
curl "http://localhost:5000/api/users/24/flats"
```

---

### `POST /users`
Purpose: Create an app/management user.

Body (common):
- `full_name` (string, required)
- `email_id` (string, required)
- `mobile_number` (string, required, 10 digits)
- `gender` (string, optional)
- `account_type` (string, optional; ex: `app`, `management`)
- `user_type` (string, required; role name)
- `os_type` (string, optional)
- `password_hash` (string, required in current implementation)
- `society_id` (number, optional)
- `flat_mappings` (array, optional) -> `{ flat_id, ownership_type: "Owner"|"Tenant" }`

Example:
```bash
curl -X POST "http://localhost:5000/api/users" \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Test Resident\",\"email_id\":\"test.resident@example.com\",\"mobile_number\":\"9999999999\",\"gender\":\"Male\",\"account_type\":\"app\",\"user_type\":\"Owner\",\"os_type\":\"Android\",\"password_hash\":\"123456\",\"society_id\":108,\"flat_mappings\":[{\"flat_id\":3016,\"ownership_type\":\"Owner\"}]}"
```

---

### `PUT /users/:id`
Purpose: Update a user.

Path:
- `:id` (number, required)

Body:
- Same shape as create.

Example:
```bash
curl -X PUT "http://localhost:5000/api/users/24" \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Pratik Mali\",\"email_id\":\"d.msdfali@asmitagroup.com\",\"mobile_number\":\"7709995980\",\"gender\":\"Male\",\"account_type\":\"app\",\"user_type\":\"Owner\",\"os_type\":\"Android\",\"password_hash\":\"1234\",\"society_id\":108,\"flat_mappings\":[{\"flat_id\":3016,\"ownership_type\":\"Owner\"}]}"
```

---

### `DELETE /users/:id`
Purpose: Soft delete / deactivate a user (implementation-specific).

Path:
- `:id` (number, required)

Example:
```bash
curl -X DELETE "http://localhost:5000/api/users/24"
```

---

### `GET /users/stats`
Purpose: Return user statistics (implementation-specific).

Example:
```bash
curl "http://localhost:5000/api/users/stats"
```

---

## Societies (`/societies`)

### `GET /societies`
Purpose: List active societies (`is_active=1`).

Query:
- `search` (string, optional) -> matches name/address/city

Example:
```bash
curl "http://localhost:5000/api/societies?search=hiranandani"
```

---

### `POST /societies`
Purpose: Create a society.

Body (required):
- `society_name` (string)
- `city` (string)
- `contact_number` (string)

Body (optional):
- `state`, `country`, `pincode`, `contact_email`, `address`, `google_map_url`, `latitude`, `longitude`

Example:
```bash
curl -X POST "http://localhost:5000/api/societies" \
  -H "Content-Type: application/json" \
  -d "{\"society_name\":\"Demo Society\",\"city\":\"Pune\",\"contact_number\":\"9999999999\",\"address\":\"Demo address\"}"
```

---

### `PUT /societies/:id`
Purpose: Update a society.

Path:
- `:id` (number, required)

Body:
- Same shape as create.

Example:
```bash
curl -X PUT "http://localhost:5000/api/societies/108" \
  -H "Content-Type: application/json" \
  -d "{\"society_name\":\"Demo Society Updated\",\"city\":\"Pune\",\"contact_number\":\"9999999999\",\"address\":\"Updated address\"}"
```

---

### `DELETE /societies/:id`
Purpose: Deactivate a society (`is_active=0`).

Path:
- `:id` (number, required)

Example:
```bash
curl -X DELETE "http://localhost:5000/api/societies/108"
```

---

### `GET /societies/:id/towers`
Purpose: List towers for a society.

Path:
- `:id` (number, required) -> `society_id`

Example:
```bash
curl "http://localhost:5000/api/societies/108/towers"
```

---

### `POST /societies/towers/bulk`
Purpose: Sync tower names list for a society (insert missing, delete removed).

Body:
- `society_id` (number, required)
- `towers` (string[], required) -> tower names

Example:
```bash
curl -X POST "http://localhost:5000/api/societies/towers/bulk" \
  -H "Content-Type: application/json" \
  -d "{\"society_id\":108,\"towers\":[\"A\",\"B\"]}"
```

---

### `DELETE /societies/towers/:towerId`
Purpose: Delete a tower by id (cascades floors/flats via FK rules, if configured).

Path:
- `:towerId` (number, required)

Example:
```bash
curl -X DELETE "http://localhost:5000/api/societies/towers/73"
```

---

### `POST /societies/units/generate`
Purpose: Generate floors/flats for towers.

Body:
- `configs` (array, required) -> supports both `floors[]` mode and `total_floors/units_per_floor` mode

Example (simple mode):
```bash
curl -X POST "http://localhost:5000/api/societies/units/generate" \
  -H "Content-Type: application/json" \
  -d "{\"configs\":[{\"tower_id\":73,\"total_floors\":2,\"units_per_floor\":2,\"unit_types\":[\"1BHK\",\"1BHK\"],\"status\":\"available\"}]}"
```

---

### `GET /societies/:id/configs`
Purpose: Fetch stored configs for a society (tower/floor/unit summary).

Path:
- `:id` (number, required) -> `society_id`

Example:
```bash
curl "http://localhost:5000/api/societies/108/configs"
```

---

## Flats (`/flats`)

### `GET /flats/assigned`
Purpose: Get flat ids that are already assigned.

Query:
- `societyId` (number, required)

Example:
```bash
curl "http://localhost:5000/api/flats/assigned?societyId=108"
```

---

### `POST /flats/generate`
Purpose: Generate flats for floors (and optional merged sets).

Body:
- `floor_ids` (number[], required)
- `units_per_floor` (number, required)
- `unit_types` (string[], optional)
- `starting_number` (number, optional)
- `merged_units` (array, optional)

Example:
```bash
curl -X POST "http://localhost:5000/api/flats/generate" \
  -H "Content-Type: application/json" \
  -d "{\"floor_ids\":[1],\"units_per_floor\":3,\"unit_types\":[\"1BHK\",\"2BHK\",\"3BHK\"],\"starting_number\":1}"
```

---

### `GET /flats/society/:societyId`
Purpose: List flats for a society (includes tower/floor info).

Path:
- `:societyId` (number, required)

Example:
```bash
curl "http://localhost:5000/api/flats/society/108"
```

---

### `GET /flats/:flatId`
Purpose: Fetch a flat by id.

Path:
- `:flatId` (number, required)

Example:
```bash
curl "http://localhost:5000/api/flats/3016"
```

---

### `POST /flats/update-structure`
Purpose: Update a floor's flat structure (supports multiple payload shapes).

Body:
- Varies (see `backend/controllers/flatsController.js`)

Example (tower+floor payload):
```bash
curl -X POST "http://localhost:5000/api/flats/update-structure" \
  -H "Content-Type: application/json" \
  -d "{\"tower_id\":73,\"floor_number\":3,\"units\":[{\"number\":\"01\",\"unit_type\":\"1BHK\"},{\"number\":\"02\",\"unit_type\":\"2BHK\"}]}"
```

---

### `PUT /flats/unit-types/bulk`
Purpose: Bulk update `unit_type` for flats.

Body:
- `updates` (array, required) -> `{ flat_id, unit_type }`

Example:
```bash
curl -X PUT "http://localhost:5000/api/flats/unit-types/bulk" \
  -H "Content-Type: application/json" \
  -d "{\"updates\":[{\"flat_id\":3016,\"unit_type\":\"2BHK\"}]}"
```

---

## Units (`/units`)

### `POST /units/merge`
Purpose: Merge multiple flats into a single merged unit row (e.g. `101+102`).

Body:
- `flat_ids` (number[], required; min 2; must be on same floor)

Example:
```bash
curl -X POST "http://localhost:5000/api/units/merge" \
  -H "Content-Type: application/json" \
  -d "{\"flat_ids\":[3016,3017]}"
```

---

### `POST /units/unmerge`
Purpose: Unmerge a previously merged unit.

Body:
- (see `backend/controllers/unit/unitMergeController.js`)

Example (payload depends on your controller implementation):
```bash
curl -X POST "http://localhost:5000/api/units/unmerge" \
  -H "Content-Type: application/json" \
  -d "{\"merged_unit_id\":1}"
```

---

## Import

### `POST /import-units`
Purpose: Import units via CSV/XLSX.

Form-data:
- `file` (required) -> uploaded via multer

Example:
```bash
curl -X POST "http://localhost:5000/api/import-units" \
  -F "file=@units.xlsx"
```

---

## Society Admins (`/society-admins`)

### `GET /society-admins`
Purpose: List society admins.

Example:
```bash
curl "http://localhost:5000/api/society-admins"
```

---

### `POST /society-admins`
Purpose: Create a society admin.

Body:
- `society_admin_name` (string, required)
- `society_id` (number, required)
- `email` (string, required)
- `phone` (string, required, 10 digits)
- `password_hash` (string, required)

Example:
```bash
curl -X POST "http://localhost:5000/api/society-admins" \
  -H "Content-Type: application/json" \
  -d "{\"society_admin_name\":\"Society Admin\",\"society_id\":108,\"email\":\"sa@example.com\",\"phone\":\"9999999999\",\"password_hash\":\"123456\"}"
```

---

### `PUT /society-admins/:id`
Purpose: Update a society admin.

Path:
- `:id` (number, required)

Example:
```bash
curl -X PUT "http://localhost:5000/api/society-admins/20" \
  -H "Content-Type: application/json" \
  -d "{\"society_admin_name\":\"Society Admin Updated\",\"society_id\":108,\"email\":\"sa@example.com\",\"phone\":\"9999999999\",\"password_hash\":\"123456\"}"
```

---

### `DELETE /society-admins/:id`
Purpose: Delete/deactivate a society admin.

Path:
- `:id` (number, required)

Example:
```bash
curl -X DELETE "http://localhost:5000/api/society-admins/20"
```

---

## Dashboard (`/dashboard`)

### `GET /dashboard/stats`
Purpose: Aggregate counts used by the dashboard.

Example:
```bash
curl "http://localhost:5000/api/dashboard/stats"
```

---

## Settings (`/settings`)

### `GET /settings`
Purpose: Get app settings (roles + restrictions).

Example:
```bash
curl "http://localhost:5000/api/settings"
```

---

### `PUT /settings`
Purpose: Update app settings (roles + restrictions).

Body:
- `{ roles: [...], restrictions: {...} }`

Example (minimal payload):
```bash
curl -X PUT "http://localhost:5000/api/settings" \
  -H "Content-Type: application/json" \
  -d "{\"roles\":[],\"restrictions\":{\"enableVisitorAndSecurityRoles\":true}}"
```

---

### `GET /settings/roles`
Purpose: List roles only.

Example:
```bash
curl "http://localhost:5000/api/settings/roles"
```

---

## Visitor Management (MVP)

### Database

Run this SQL once on the configured MySQL database:
- `backend/sql/2026_05_08_visitor_management.sql`

Creates:
- `visitor_types`
- `visitor_entries`

### Status flow

`PENDING` -> `APPROVED`/`REJECTED` -> `CHECKED_IN` -> `CHECKED_OUT`

### Temporary testing headers

- `x-society-id`: society context (guard list/create). If omitted, falls back to `1`.
- `x-user-id`: acting user id (resident approve/reject and guard create fallback).

### `GET /visitor-types`
Purpose: List visitor types for dropdowns.

Example:
```bash
curl "http://localhost:5000/api/visitor-types"
```

---

### `POST /visitor-entries`
Purpose: Guard creates a visitor request (saved as `PENDING`).

Body:
- `society_id` (number, required)
- `tower_id` (number, required)
- `unit_id` (number, required) -> existing `flats.flat_id` (supports merged units like `101+102`)
- `resident_user_id` (number, optional) -> auto-resolved from `user_flat_mapping` if available
- `visitor_name` (string, required)
- `visitor_phone` (string, required, 10 digits)
- `visitor_type_id` (number, optional)
- `purpose` (string, optional)
- `vehicle_number` (string, optional)
- `no_of_visitors` (number, optional, default `1`)
- `remarks` (string, optional)
- `user_id` (number, optional) -> used as `requested_by_guard_id` (fallback is `1`)

Example:
```bash
curl -X POST "http://localhost:5000/api/visitor-entries" \
  -H "Content-Type: application/json" \
  -d "{\"society_id\":108,\"tower_id\":73,\"unit_id\":3016,\"visitor_name\":\"Saumya\",\"visitor_phone\":\"7709990498\",\"visitor_type_id\":3,\"purpose\":\"test\",\"vehicle_number\":\"123123123\",\"no_of_visitors\":1,\"remarks\":\"hello\",\"user_id\":1}"
```

---

### `GET /guard/visitor-entries`
Purpose: List visitor entries for a society (guard view).

Query (optional):
- `society_id` (number) OR header `x-society-id`

Example:
```bash
curl "http://localhost:5000/api/guard/visitor-entries?society_id=108"
```

---

### `PATCH /visitor-entries/:id/check-in`
Purpose: Mark a visitor as checked in.

Rules:
- Allowed only when `status = APPROVED`

Example:
```bash
curl -X PATCH "http://localhost:5000/api/visitor-entries/1/check-in"
```

---

### `PATCH /visitor-entries/:id/check-out`
Purpose: Mark a visitor as checked out.

Rules:
- Allowed only when `status = CHECKED_IN`

Example:
```bash
curl -X PATCH "http://localhost:5000/api/visitor-entries/1/check-out"
```

---

### `GET /resident/visitor-requests`
Purpose: List visitor requests for a resident user.

Provide resident user id via:
- Header: `x-user-id` OR query: `user_id`

Example:
```bash
curl "http://localhost:5000/api/resident/visitor-requests?user_id=24"
```

---

### `PATCH /visitor-entries/:id/approve`
Purpose: Resident approves a pending visitor request.

Rules:
- Only allowed when `status = PENDING`
- Only allowed if resident is mapped to that unit (via `user_flat_mapping`) or matches `resident_user_id`

Example:
```bash
curl -X PATCH "http://localhost:5000/api/visitor-entries/1/approve" \
  -H "x-user-id: 24"
```

---

### `PATCH /visitor-entries/:id/reject`
Purpose: Resident rejects a pending visitor request.

Body:
- `rejection_reason` (string, required)

Example:
```bash
curl -X PATCH "http://localhost:5000/api/visitor-entries/1/reject" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 24" \
  -d "{\"rejection_reason\":\"Not expected\"}"
```

---

### `GET /visitor-entries/resolve-resident?unit_id=<flat_id>`
Purpose: Resolve a resident for a unit (used by guard UI to auto-fill resident).

Example:
```bash
curl "http://localhost:5000/api/visitor-entries/resolve-resident?unit_id=3016"
```

