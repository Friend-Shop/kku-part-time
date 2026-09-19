# KKU PART-TiME — Project Documentation

> **Repository:** https://github.com/Friend-Shop/kku-part-time  
> **Branch reviewed:** `main`  
> **Document purpose:** Technical and product documentation for the current KKU PART-TiME web application.

---

## 1. Project Overview

**KKU PART-TiME** is a web application designed to connect **Khon Kaen University students looking for part-time work** with **shops/employers looking for student workers**.

The project combines two related systems:

1. **Student part-time job matching**
2. **Personal student finance management**

The key idea is that job recommendations should consider a student's **class schedule**, so students can discover jobs that fit around their academic timetable rather than searching only by job category.

The application is intended to support multiple roles:

- **Student**
- **Employer / Shop**
- **Admin**

The Admin role is intended to provide system-wide management capabilities.

---

## 2. Main Product Goals

### Student

Students should be able to:

- Create and manage a student profile
- Enter skills, preferences, and job-related information
- Upload/import class schedules
- View available part-time jobs
- Receive job recommendations
- Check job details
- Apply for jobs
- Track application status
- Manage earnings
- Record and monitor expenses
- Create budgets
- View financial progress
- View notifications
- Manage personal settings/profile

### Employer / Shop

Employers should be able to:

- Create/manage a shop or employer profile
- Create part-time job postings
- Define job requirements
- Define working days/hours
- Review student applications
- Manage applicants
- Manage job-posting status
- View relevant student information

### Admin

The Admin area is intended to provide centralized management of:

- Students
- Employers
- Shops
- Job postings
- Applications
- System data
- User/account status
- Administrative monitoring

---

## 3. Core Matching Concept

The main differentiating feature is **schedule-aware job matching**.

Instead of matching only on:

- Job category
- Skills
- Location
- Salary

the system can also consider whether the student's **class schedule conflicts with the job's working time**.

### Conceptual flow

```text
Student
   |
   +--> Student Profile
   |
   +--> Skills / Preferences
   |
   +--> Class Schedule (.ics)
   |
   v
Matching Engine
   |
   +--> Job Requirements
   +--> Job Working Hours
   +--> Location / Other Filters
   |
   v
Recommended Part-time Jobs
```

### Example

If a student has:

```text
Monday
09:00 - 12:00  Class
13:00 - 16:00  Class
```

a job requiring:

```text
Monday
10:00 - 15:00
```

should be identified as conflicting or unsuitable.

A job requiring:

```text
Monday
17:00 - 21:00
```

may be compatible.

---

## 4. Finance Module

The finance system is intended to help students understand how their part-time income relates to their spending.

### Main areas

- Earnings
- Expenses
- Budgets
- Financial progress
- Financial dashboard
- Charts / visual summaries
- Automated/natural-language financial insights where implemented

### Example financial flow

```text
Part-time Work
      |
      v
   Earnings
      |
      +----------------+
      |                |
      v                v
   Budget          Expenses
      |                |
      +-------+--------+
              |
              v
       Financial Summary
```

---

## 5. Current Repository Technology

The repository currently uses a modern TypeScript web stack.

### Frontend / application

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack React Start
- React Hook Form
- Zod
- Tailwind CSS
- Radix UI
- Lucide React
- Recharts
- Sonner
- i18next / react-i18next

### Backend / data

- Supabase
- PostgreSQL through Supabase
- Supabase Auth
- `@supabase/supabase-js`

### AI / browser ML dependencies

The repository includes browser-side ML/computer-vision packages:

- MediaPipe Pose
- MediaPipe Camera Utils
- MediaPipe Drawing Utils
- TensorFlow.js
- ONNX Runtime Web

These dependencies provide a foundation for future or existing browser-based intelligent features.

### Deployment

The repository contains Cloudflare Worker deployment configuration:

- Cloudflare Vite plugin
- Wrangler
- Cloudflare Workers
- Node.js compatibility mode

---

## 6. Package Scripts

Current scripts defined in `package.json` include:

```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run format
npm run deploy
npm run cf:dev
npm run cf:typegen
```

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

### Cloudflare deployment

```bash
npm run deploy
```

This runs:

```bash
npm run build && wrangler deploy
```

---

## 7. Repository Structure

The repository currently contains the following major areas:

```text
kku-part-time/
│
├── .lovable/
│
├── public/
│
├── src/
│   ├── application source code
│   ├── routes
│   ├── components
│   ├── utilities
│   ├── server entry
│   └── application logic
│
├── supabase/
│   └── database-related files / migrations
│
├── work/
│
├── .env
├── .gitignore
├── .prettierignore
├── .prettierrc
├── components.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc
```

> The GitHub repository currently exposes the main application folders and configuration files above. Some nested `src/` and `work/` directories could not be enumerated reliably through the public GitHub web interface during documentation generation, so this document intentionally avoids inventing individual filenames that could not be verified.

---

## 8. Server Architecture

The current Cloudflare server entry is:

```text
src/server.ts
```

The server dynamically loads the TanStack Start server entry:

```text
@tanstack/react-start/server-entry
```

The server also contains an error-normalization layer.

### Error handling concept

```text
Request
  |
  v
Cloudflare Worker
  |
  v
TanStack Start Server Entry
  |
  +---- success ----> Response
  |
  +---- SSR error --> normalize error
                       |
                       v
                 Branded 500 page
```

The implementation specifically detects a swallowed SSR `HTTPError` response and converts it into a branded error page instead of returning the raw JSON error body.

---

## 9. Cloudflare Configuration

Current `wrangler.jsonc` configuration is based on:

```json
{
  "name": "kku-part-time",
  "compatibility_date": "2026-09-08",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./src/server.ts",
  "observability": {
    "enabled": true
  }
}
```

### Important deployment values

| Setting | Current value |
|---|---|
| Worker name | `kku-part-time` |
| Entry | `./src/server.ts` |
| Compatibility date | `2026-09-08 |
| Node compatibility | Enabled |
| Observability | Enabled |

---

## 10. Database Architecture

The application uses **Supabase** as its backend platform.

The application architecture is intended to separate:

```text
Authentication
      |
      v
User / Profile
      |
      +------------------+
      |                  |
      v                  v
Student              Employer
      |                  |
      v                  v
Class Schedule       Shop / Jobs
      |                  |
      +--------+---------+
               |
               v
        Job Applications
               |
               v
          Notifications
```

The finance side connects to the student account:

```text
Student
  |
  +--> Earnings
  |
  +--> Expenses
  |
  +--> Budgets
  |
  +--> Financial Progress
```

---

## 11. Authentication

Authentication is handled through Supabase.

The application requires environment configuration for the Supabase client.

Typical frontend configuration follows the project convention:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Security rule

Do **not** commit real secrets, service-role keys, passwords, or private credentials to Git.

Only public client configuration intended for browser use should be exposed to the frontend.

---

## 12. Roles and Access Control

The application is designed around role-based behavior.

### Student

Access to:

- Student dashboard
- Job discovery
- Job recommendations
- Applications
- Schedule
- Earnings
- Budgets
- Expenses
- Notifications
- Profile

### Employer / Shop

Access to:

- Employer dashboard
- Shop management
- Job management
- Applicant management
- Application status

### Admin

Access to:

- User management
- Student management
- Employer/shop management
- Job management
- Application management
- System-wide monitoring

### Recommended authorization principle

Role checks should exist at both:

1. **UI / route level**
2. **Database / Supabase RLS level**

The UI should never be treated as the only security boundary.

---

## 13. Student Schedule System

The application supports the concept of importing or storing class schedules, including `.ics` calendar data.

### Intended workflow

```text
Student
  |
  v
Upload .ics
  |
  v
Parse calendar events
  |
  v
Normalize:
- day
- start time
- end time
- subject
- location
  |
  v
Store class schedule
  |
  v
Use schedule in job matching
```

### Important database relationship

The project has previously used a relationship involving:

```text
class_schedules.student_id
```

The student ID must correspond to the appropriate student/profile record.

Foreign-key errors involving `class_schedules_student_id_fkey` indicate that schedule data is being inserted before a matching student record exists, or that the wrong identifier is being supplied.

---

## 14. Job Matching

The matching system should treat the following information as matching signals:

### Student-side

- Class schedule
- Skills
- Job preferences
- Availability
- Preferred job type
- Location
- Salary expectations
- Experience

### Employer-side

- Job category
- Required skills
- Work schedule
- Salary
- Location
- Number of openings
- Job status

### Conceptual scoring

```text
Match Score =
    Schedule Compatibility
  + Skill Compatibility
  + Preference Compatibility
  + Availability Compatibility
  + Location Compatibility
  + Compensation Compatibility
```

A schedule conflict should be treated as a strong constraint rather than simply a weak preference.

---

## 15. Main Student UI Areas

The current application work has included the following student-facing areas:

- Login
- Student notifications
- Student earnings
- Student calendar
- Student budgets
- Student dashboard
- Student profile
- Job matching / recommendations
- Job list / job detail
- Applications

The exact route names may change as the project evolves.

---

## 16. Finance UI Areas

The finance section includes concepts for:

### Earnings

Track income generated from part-time work.

Possible data:

```text
Job
Employer
Date
Hours
Rate
Amount
Status
```

### Expenses

Track personal spending.

Possible data:

```text
Date
Category
Description
Amount
Payment method
```

### Budget

Track spending against a planned limit.

Example:

```text
Monthly Budget
    |
    +-- Food
    +-- Transportation
    +-- Entertainment
    +-- Education
    +-- Other
```

### Dashboard

Useful metrics include:

- Total earnings
- Total expenses
- Remaining budget
- Savings
- Monthly comparison
- Category breakdown

---

## 17. Notifications

The application contains a student notification area.

Potential notification events include:

- Application submitted
- Application accepted
- Application rejected
- Employer message
- Job status changed
- Schedule-related notification
- Financial/budget alert

Notifications should ideally contain:

```text
id
user_id
title
message
type
is_read
created_at
```

---

## 18. UI / Design Direction

The project's intended visual direction is:

- Minimal
- Clean
- Modern
- Student-friendly
- Professional
- Not overly "AI-looking"
- Easy to scan
- Responsive

The interface should prioritize information hierarchy rather than excessive cards, gradients, glowing effects, or decorative AI visuals.

### Suggested design principles

```text
Clear navigation
      ↓
Strong page hierarchy
      ↓
Simple cards
      ↓
Useful data visualization
      ↓
Minimal decorative elements
```

---

## 19. Internationalization

The repository includes:

- `i18next`
- `i18next-browser-languagedetector`
- `react-i18next`

This provides a foundation for multilingual UI.

The application can therefore support:

- Thai
- English

without hard-coding all UI strings directly into components.

---

## 20. Browser AI / Computer Vision Dependencies

The repository includes:

```text
MediaPipe Pose
TensorFlow.js
ONNX Runtime Web
```

These technologies can support client-side intelligent features without requiring every inference request to be sent to a server.

Possible use cases include:

- Pose estimation
- Exercise/posture analysis
- Browser-side ML inference

These dependencies should only be considered part of the KKU PART-TiME product if the related feature is actually connected to a current application flow.

---

## 21. Current Technical Risks

### 21.1 Authentication / login

The project has previously experienced a situation where the login message disappeared while the page remained on the login screen.

When debugging authentication, check:

```text
Supabase URL
Supabase anon key
Auth response
Session persistence
Auth state listener
Route guards
Profile loading
Role detection
```

A successful Supabase authentication response does not necessarily mean the application successfully loaded the user's profile and redirected to the correct role-based dashboard.

---

### 21.2 Profile creation

A user's authentication record and application profile are separate concepts.

The application should guarantee:

```text
auth.users
     |
     | 1:1 / expected relationship
     v
profiles / student profile
```

before attempting operations that require the profile ID.

---

### 21.3 Class schedule foreign keys

When inserting a class schedule:

```text
class_schedules.student_id
```

must reference an existing student/profile record.

Recommended debugging order:

1. Check authenticated user ID.
2. Check profile ID.
3. Check student record.
4. Check the foreign-key relationship.
5. Insert schedule using the correct student ID.

---

### 21.4 Supabase migration synchronization

Schema changes should be versioned through migration files.

Recommended workflow:

```text
Change schema
    |
    v
Create migration
    |
    v
Test locally / staging
    |
    v
Apply to Supabase
    |
    v
Verify application
```

Do not rely on manually changing the production database without recording the change in version control.

---

### 21.5 Cloudflare SSR

The project uses TanStack Start + Cloudflare Workers.

The server entry and Vite/Cloudflare configuration must remain compatible.

Changes to:

```text
vite.config.ts
wrangler.jsonc
src/server.ts
TanStack Start configuration
```

should be tested with a production build before deployment.

---

## 22. Recommended Local Development Workflow

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Configure environment

Create/update:

```text
.env
```

with the required Supabase variables.

### Step 3 — Run development server

```bash
npm run dev
```

### Step 4 — Test application flows

At minimum:

```text
Login
  ↓
Student dashboard
  ↓
Profile
  ↓
Schedule
  ↓
Job matching
  ↓
Application
  ↓
Earnings / Finance
```

### Step 5 — Validate production build

```bash
npm run build
```

### Step 6 — Deploy

```bash
npm run deploy
```

---

## 23. Production Deployment Architecture

```text
                    GitHub
                      |
                      v
              Source Repository
                      |
                      v
                Build Pipeline
                      |
              +-------+-------+
              |               |
              v               v
          Vite Build      Wrangler
                              |
                              v
                     Cloudflare Workers
                              |
                 +------------+------------+
                 |                         |
                 v                         v
          TanStack Start              Static Assets
                 |
                 v
             Supabase
                 |
        +--------+---------+
        |                  |
        v                  v
     Auth / DB          Storage
```

---

## 24. Environment Variables

The application should use environment variables for deployment-specific configuration.

Expected categories:

```text
Supabase project URL
Supabase public/anon key
```

Do not store:

```text
Supabase service-role key
Database password
Private API keys
Cloudflare secrets
Other server-only secrets
```

in frontend source code.

---

## 25. Testing Checklist

Before considering a release ready, test:

### Authentication

- [ ] Student can sign up
- [ ] Student can log in
- [ ] Invalid credentials show a useful error
- [ ] Session persists after refresh
- [ ] Logout works
- [ ] Correct role dashboard loads

### Student profile

- [ ] Profile can be created
- [ ] Profile can be updated
- [ ] Skills/preferences are saved
- [ ] Location/availability data is saved

### Schedule

- [ ] `.ics` file can be uploaded/imported
- [ ] Events are parsed correctly
- [ ] Schedule is saved
- [ ] Existing student ID is used
- [ ] Schedule conflicts can be detected

### Jobs

- [ ] Jobs can be viewed
- [ ] Job details are correct
- [ ] Matching results load
- [ ] Schedule compatibility is considered
- [ ] Student can apply

### Applications

- [ ] Application is created
- [ ] Status is visible
- [ ] Employer can review application
- [ ] Student receives status update

### Finance

- [ ] Earnings can be recorded
- [ ] Expenses can be recorded
- [ ] Budgets can be created
- [ ] Totals are correct
- [ ] Charts use live data
- [ ] Progress calculations are correct

### Admin

- [ ] Admin can access admin routes
- [ ] Admin can manage users
- [ ] Admin can manage employers
- [ ] Admin can manage jobs
- [ ] Admin permissions are enforced

### Deployment

- [ ] Production build succeeds
- [ ] Cloudflare Worker starts
- [ ] Supabase environment variables are configured
- [ ] Login works in production
- [ ] SSR routes work
- [ ] Refreshing nested routes works

---

## 26. Suggested Data Model

A conceptual relational model for the complete system is:

```text
users/auth
    |
    +--------------------+
    |                    |
    v                    v
students             employers
    |                    |
    |                    v
    |                  shops
    |                    |
    |                    v
    |                   jobs
    |                    |
    +--------+-----------+
             |
             v
       applications
             |
             v
       notifications


students
   |
   +--> class_schedules
   |
   +--> earnings
   |
   +--> expenses
   |
   +--> budgets
   |
   +--> preferences
```

---

## 27. Product-Level User Journey

### Student journey

```text
Sign Up
  ↓
Create Profile
  ↓
Add Skills / Preferences
  ↓
Import Class Schedule
  ↓
View Recommended Jobs
  ↓
Open Job
  ↓
Apply
  ↓
Track Application
  ↓
Get Hired
  ↓
Record Earnings
  ↓
Manage Budget
  ↓
Track Expenses
```

### Employer journey

```text
Sign Up
  ↓
Create Employer / Shop Profile
  ↓
Create Job
  ↓
Set Work Schedule
  ↓
Receive Applications
  ↓
Review Students
  ↓
Accept / Reject
  ↓
Manage Hiring
```

### Admin journey

```text
Admin Login
  ↓
Admin Dashboard
  ↓
Monitor Users
  ↓
Manage Students
  ↓
Manage Employers
  ↓
Manage Shops
  ↓
Manage Jobs
  ↓
Monitor Applications
```

---

## 28. Development Priorities

Recommended implementation order:

### Phase 1 — Foundation

- [ ] Authentication
- [ ] Role management
- [ ] Student profile
- [ ] Employer profile
- [ ] Database/RLS verification

### Phase 2 — Job System

- [ ] Job CRUD
- [ ] Search/filter
- [ ] Job detail
- [ ] Application flow

### Phase 3 — Schedule Matching

- [ ] `.ics` import
- [ ] Schedule normalization
- [ ] Conflict detection
- [ ] Matching score
- [ ] Recommendation UI

### Phase 4 — Finance

- [ ] Earnings
- [ ] Expenses
- [ ] Budgets
- [ ] Financial dashboard
- [ ] Charts
- [ ] Progress calculations

### Phase 5 — Admin

- [ ] Admin dashboard
- [ ] User management
- [ ] Employer management
- [ ] Job management
- [ ] Application management

### Phase 6 — Production

- [ ] RLS audit
- [ ] Error handling
- [ ] Mobile responsive QA
- [ ] Performance
- [ ] Cloudflare production testing
- [ ] Production authentication testing

---

## 29. Important Engineering Rules

### Rule 1 — Do not trust client-side roles

Role authorization must be enforced server-side/database-side.

### Rule 2 — Keep database changes versioned

Use Supabase migrations for schema changes.

### Rule 3 — Separate auth identity from application profile

Do not assume the Supabase Auth user ID is always the same identifier as the application's student/profile ID.

### Rule 4 — Test real Supabase data

Mock data can hide:

- Foreign-key errors
- RLS problems
- Null relationships
- Missing profile records
- Incorrect joins

### Rule 5 — Production build before deployment

Always run:

```bash
npm run build
```

before deploying.

### Rule 6 — Avoid exposing secrets

Frontend code must never contain service-role credentials or database passwords.

---

## 30. Project Status Notes

This documentation reflects the repository structure and configuration visible during review, plus the intended KKU PART-TiME product architecture.

The GitHub repository currently identifies itself as:

```text
Friend-Shop/kku-part-time
```

and its main branch contains the application source, Supabase directory, Cloudflare configuration, package configuration, and server entry.

Because the public GitHub web interface did not expose every nested source directory reliably during this review, individual implementation details that could not be directly verified are deliberately described as **conceptual/intended behavior** rather than claimed as confirmed code behavior.

---

## 31. Useful Commands

```bash
# Install
npm install

# Development
npm run dev

# Production build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Format
npm run format

# Cloudflare local development
npm run cf:dev

# Generate Cloudflare types
npm run cf:typegen

# Deploy
npm run deploy
```

---

## 32. Documentation Maintenance

Update this file whenever one of the following changes:

- Database schema
- User roles
- Matching algorithm
- Job/application workflow
- Finance features
- Authentication architecture
- Cloudflare configuration
- Environment variables
- Major routes
- Major dependencies
- Deployment process

Recommended location:

```text
/docs/PROJECT_DOCUMENTATION.md
```

or, if a single root documentation file is preferred:

```text
PROJECT_DOCUMENTATION.md
```

---

## 33. One-Sentence Project Description

> **KKU PART-TiME is a student-focused job matching and personal finance web application that connects KKU students with part-time employers while using class schedules to help identify compatible work opportunities.**
