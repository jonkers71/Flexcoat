# FlexCoat Job Card Web App Conversion

Convert the "FlexCoat Job Card" spreadsheet-style form into a modern, mobile-responsive web application with flexible pricing, labour tracking, and PDF generation.

## User Review Required

> [!IMPORTANT]
> **Invoicing Placeholder**: I will include an "Invoice Status" and "Accounting Export" placeholder. This will be ready to bridge into Xero or MYOB once the accounting system is confirmed.
> 
> [!NOTE]
> **Pricing Flexibility**: Defaults will be set per item (e.g.,## Phase 4: Offline Capabilities (PWA) & Core Features [COMPLETE]
- [x] **PWA Configuration**: Installed `@ducanh2912/next-pwa`, added `manifest.json`, and set up service worker.
- [x] **Metadata**: Updated `layout.tsx` for SEO and PWA-specific tags.
- [x] **Drafts**: Implemented localStorage-based persistent drafts.

## Phase 5: Enhanced Data Capture & Storage [COMPLETE]
- [x] **Photo Uploads**: Supabase Storage integration with mobile camera support.
- [x] **Digital Signatures**: `react-signature-canvas` integration for on-device sign-offs.
- [x] **Geolocation**: Automatic capture and database storage.
- [x] **PDF Storage**: Auto-upload generated job cards to Supabase Storage.

## Phase 6: Workflow & Management [COMPLETE]
- [x] **Email Notifications**: Automated notifications via Resend API.
- [x] **Job Dashboard**: Searchable history with view/delete capabilities.
- [x] **Auto-population**: Fetching previous data by Quote #.

## Phase 7: Security & Polishment [NEXT]
- [ ] **Supabase Auth**: Secure the app with login/registration.
- [ ] **Data Encryption**: Encrypt sensitive data in Storage.
 |
| --- | --- | --- |
| **Framework** | Next.js (App Router) | Best for performance and seamless API routes. |
| **Styling** | Tailwind CSS + Shadcn UI | Premium, mobile-first UI components. |
| **Database** | Supabase | Relational data for Jobs, Items, and Pricing rates. |
| **PDF Gen** | `@react-pdf/renderer` | Robust PDF generation for job cards. |
| **Email** | Resend | Simple API for sending emails with attachments. |

### Component Architecture

**1. Data Model (Supabase)**
- `jobs`: Stores top-level job info and total costs.
- `job_items`: Individual measurements, quantities, and custom price overrides for a specific job.
- `pricing_defaults`: Global lookup table for standard item rates.

**2. Key Features & Screens**
- **Job Form**: Mobile-optimized form with sections:
  1. Internal Wet Areas
  2. External Wet Areas
  3. Retaining Walls & Planter Boxes
  4. Window Reveals
  5. Extra / Additional Work
  6. **New: Labour & Call-out Fees**
- **Pricing Settings**: Tab to update global default rates.
- **Job Preview**: Generate and view PDF summary.

**3. Workflow**
1. User enters measurements on mobile.
2. Prices are calculated dynamically based on defaults (can be manually adjusted).
3. User saves job and generates a PDF for the accountant/customer.
4. "Sync to Accounting" placeholder remains ready for MYOB/Xero integration.

---

## Verification Plan

### Automated Tests
- Dynamic pricing calculation unit tests.
- PDF generation consistency checks.

### Manual Verification
- Verify PDF reflects the original form's layout and branding.
- Cross-browser and mobile device testing for the responsive form.
