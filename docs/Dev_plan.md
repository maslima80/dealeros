DealerOS V1 Web-First — Full Phased Development Roadmap
Phase 0 — Foundation & Project Scaffolding
Goal: Create a stable base you won’t redo later.
Build
Next.js (App Router) + TS + Tailwind
Database + ORM (Neon + Drizzle is fine)
Deployment (Vercel)
Core layout shell (dashboard layout + public layout)
Shared UI primitives (forms, tables, cards, modals)
Logging + error reporting basics
Test checkpoint
App deploys
Health page loads
DB connects in all environments

Phase 1 — Auth + Tenant Model + 14-Day Trial Gate
Goal: Secure access, isolate dealer data, enforce trial without Stripe.
Build
Auth (Supabase/Clerk/NextAuth—your choice, but pick one)
Dealer “tenant” creation on signup (dealer profile stub)
Trial logic:
trial_starts_at, trial_ends_at, status
Route gating:
Allowed: trial/active
Blocked: expired
Simple admin override (internal-only):
Extend trial
Change status manually
Test checkpoint
Signup → dealer profile created → dashboard
Expired trial user is blocked
Admin override restores access

Phase 2 — Dealer Profile + Public Site Skeleton
Goal: Public presence exists early and grows over time.
Build
Dealer profile editor:
name, address, phone, email, slug
Public dealer page route:
/{dealerSlug}
Basic public layout and SEO-friendly structure
Test checkpoint
Public page loads for dealer slug
Editing dealer profile updates public page immediately

Phase 3 — Core Inventory (Vehicle CRUD + Status + Global Visibility)
Goal: Vehicles exist as first-class objects.
Build
Vehicles:
Add vehicle (manual VIN required)
Decode later; allow manual YMMT fallback if needed
Vehicle list + filters by status
Vehicle detail page
Vehicle status workflow:
Purchased → Recon → Ready → Listed → Sold
Global visibility toggle:
is_public (vehicle can be hidden entirely from public)
Test checkpoint
Add 10 vehicles quickly by VIN
Change statuses
Toggle public on/off
Public dealer page displays only public vehicles (even before catalogs)

Phase 3.5 — Sourcing Log (Auction Watchlist + VIN History)
Goal: Solve the “I forgot this car / I already checked it” problem.
Build
Sourcing records (VIN-first):
VIN, optional YMMT, source (Openlane/manual), status
Timeline events:
Notes with timestamp + optional tags
Quick Add flow (paste VIN + note)
VIN memory alert:
When typing a VIN anywhere, show “seen before” if in log
“Convert to Inventory”:
Turn sourcing record into a vehicle record
Test checkpoint
Add sourcing record in 10 seconds
Add 3 timeline events
VIN alert shows on vehicle add screen
Convert to inventory creates vehicle record

Phase 4 — Catalog System (Multi-Catalog + Catalog-Specific Pricing + Visibility)
Goal: Your “multi-catalog, multi-price” model becomes real.
Build
Create/edit catalogs:
name, description, is_public
Add vehicles to catalogs
Per-catalog vehicle price:
catalog_price
Per-catalog visibility toggle for a vehicle:
show/hide vehicle in that catalog without removing it
Public catalog rendering:
Dealer page shows catalogs
Catalog pages list vehicles with the correct catalog price
Test checkpoint
Same car appears in 2 catalogs with different prices
Hide car from one catalog only
Public pages show correct catalog pricing always

Phase 5 — Vehicle Photos (Mobile Upload + Ordering + Cover Photo)
Goal: Make photos reliable and tied to the system.
Build
Upload multiple photos per vehicle (mobile web works)
Reorder photos
Set cover photo
Public vehicle page shows ordered photos
Test checkpoint
Upload from phone browser
Reorder and confirm public rendering
Cover photo used in catalog and dealer listing cards

Phase 6 — Market Intelligence (MarketCheck Validation Integration)
Goal: Show market context; validate quality before scaling.
Build
“Fetch market snapshot” button on vehicle page
Store snapshot results on vehicle:
low/avg/high, comps count, last_checked_at
Show clearly with “market context” language
No caching/quotas yet (founder testing mode)
Test checkpoint
Run across many VINs
Validate output quality by region/model
Identify what fields are consistently trustworthy

Phase 7 — Cost Tracking + Receipts (Per Vehicle)
Goal: Profit clarity and discipline.
Build
Add cost line items:
category, amount, note, receipt photo
Cost totals per vehicle
Quick “total invested” view
Simple “projected profit” view (asking price − total invested)
Test checkpoint
Add full recon costs on one car
Confirm totals + receipts are clean
Profit view updates correctly

Phase 8 — Public Vehicle Pages + Listing Kit (Manual Posting Support)
Goal: Support selling without Chrome automation.
Build
Public vehicle pages with:
correct catalog price context
photos + specs
call/text/email CTAs
Listing Kit output:
copy-ready title
description block
key fields list
Photo Pack ZIP download (ordered filenames)
Test checkpoint
Dealer can copy/paste listing details quickly
Dealer can download photo pack and upload manually

Phase 9 — Test Drive Booking + Dealer Inbox
Goal: Add “inquiry capture” without becoming a CRM.
Build
Booking request form on:
vehicle page (and optionally catalog page)
Store requests:
name, phone, email, preferred time, message
Dealer inbox:
statuses: new / handled / archived
Simple “click to call/text/email” actions
Test checkpoint
Submit booking from public page
Dealer sees it immediately
Dealer marks handled and it disappears from “new”

Phase 10 — Bill of Sale (Generate PDF + Print)
Goal: Close the deal inside DealerOS.
Build
“Mark as sold” flow:
buyer info form
sale price/date
Generate PDF
Attach to vehicle record
Download/print actions
Test checkpoint
Generate BoS on 3 vehicles
Print layout correct
Vehicle becomes “Sold” and doc stored

Phase 11 — Admin, Polish, and Launch Hardening
Goal: Make it stable enough to sell.
Build
Admin tools:
trial controls
user/dealer management
Audit logs (basic)
Better empty states
Permissions tightening
Performance cleanup
Backups/export (optional)
Test checkpoint
Confident onboarding for 3–5 real dealers
No critical blockers in core loop

Phase 12 (Post-V1) — “Capture Pro” Mobile App (Native)
Goal: Only build native after real usage proves value.
Build
VIN scanning
Guided silhouette photo capture
Fast add-car flow
Receipt snap for costs
Sync to the same backend
