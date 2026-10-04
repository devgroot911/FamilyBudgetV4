# FB Calculator Implementation Plan

## 1. Inspection Report
I have inspected the repository and found that the architectural assumptions in the prompt differ significantly from the actual codebase. Here is the reality of the existing system:

- **Framework and Language:** Vanilla JavaScript (ES5/ES6), HTML, and CSS. (No React, Next.js, Laravel, or Django).
- **Backend Framework and ORM:** **None**. The application is a client-side Single Page Application (SPA) that communicates directly with Supabase via the `@supabase/supabase-js` library. There are no backend controllers, services, DTOs, or API routes.
- **Database:** Supabase (PostgreSQL).
- **Auth Mechanism & Roles:** Handled entirely client-side via a hardcoded `users` table query, stored in `sessionStorage` (with a hardcoded `Master` fallback). Roles are defined as strings (`admin`, `accountant`, `accounts_assistant`, `village_director`, `mother`).
- **Navigation:** Controlled by DOM manipulation in `app.js` (toggling `display:none` and `.active` classes on `<section class="view">` elements) based on `data-view` attributes. There is no URL routing.
- **UI Design System:** Custom CSS in `styles.css` (e.g., `.panel`, `.primary-button`, `.ghost-button`, `.table-wrap`). No external UI library.
- **Excel Utilities:** `XLSX` (SheetJS) is loaded via CDN for Excel generation.
- **File Upload/Download:** Uses standard HTML5 `<input type="file">` and `FileReader` APIs directly in the browser.
- **Permissions/Audit Logs:** Handled client-side by conditional rendering and Supabase Row Level Security (RLS) / direct table inserts.

**Impact on Deliverables:** Because there is no backend Node/PHP/Python server, the "backend module" (calculation engine, template generator, import/export) will be implemented as a modular Vanilla JavaScript file (`fb_calculator.js`) that runs in the browser, interacting with the new Supabase tables.

## 2. Proposed Data Model (Additive)
I will provide a SQL migration script (`fb_migration.sql`) to run in your Supabase SQL editor to create:
1. `fb_projects`
2. `fb_project_users` (project_id, user_username, role_scope)
3. `fb_houses` (id, project_id, house_no, mother_username)
4. `fb_rate_variables` (project_id, year, month, variable_key, value, updated_by)
5. `fb_child_counts` (project_id, year, month, house_id, food_o12, food_u12, clothing_o12, clothing_u12, household, mother_count, aunt_amount, arrears, festival, adjustment, remarks)
6. `fb_monthly_summaries` (project_id, year, month, totals_json, locked_by, locked_at)
7. `fb_audit_logs` (user_username, action, project_id, month, details_json, created_at)

*(Calculated tables like `fb_monthly_budget` and `fb_withdrawal` will be computed on-the-fly in the JS engine to prevent state mismatch, but locked values will be saved to `fb_monthly_summaries`).*

## 3. Files to Create
- `fb_calculator.js`: The standalone module containing the calculation engine, role guards, Excel import/export logic (via SheetJS), audit logging, and DOM rendering for the new FB Calculator screens.
- `fb_calculator.css`: Additive styles for the new sub-tabs and grids, ensuring zero collision with `styles.css`.
- `fb_migration.sql`: The Supabase table creation script.
- `fb_seed.sql`: Seed data for the January 2025 Demo project.

## 4. Existing Files to Touch
As requested, I will make the *absolute minimum* additive edits to existing files:

1. **`index.html`**
   - **Why:** To load the new `<script src="fb_calculator.js"></script>` and `<link rel="stylesheet" href="fb_calculator.css">`.
   - **Why:** To add the hidden `<section id="view-fb-calculator" class="view"></section>` container and the `<button class="nav-item" data-view="fb-calculator">FB Calculator</button>` to the sidebar.

2. **`app.js`**
   - **Why:** To add `'fb-calculator'` to the `views` array so the navigation router recognizes it.
   - **Why:** To add `fb-calculator: renderFbCalculator` to the `renderers` mapping so the new UI initializes when the tab is clicked.
   - **Why:** To inject the permission guard so the tab is only visible to Accounts Assistant, Accountant, National-level user, and Finance Director (System Admin).

## 5. Next Steps
Awaiting your confirmation to proceed. Once approved, I will implement this strictly one sub-screen at a time, starting with the database migrations and data layer, followed by the UI and Excel generation.
