# Trimma Field Agent Portal - User Acceptance Testing (UAT) Document

This document outlines the test cases required to validate the functionality of the **Field Agent Portal** within the Trimma platform. Field Agents use this portal to discover leads, onboard salons, manage their assigned territories, and track their commissions.

## Pre-requisites for Testing
- A test account with the **Agent** role assigned (`global_role = 'agent'`).
- Access to the Field Agent web portal (`/agent`).
- At least one Territory assigned to the test agent (can be done via the Admin Portal).
- A valid test email/phone number to simulate a new salon lead.

> [!TIP]
> Keep the Admin dashboard open in a separate incognito window to verify cross-platform data syncing (e.g., confirming a lead created by an agent appears on the Admin side).

---

## Section 1: Authentication & Dashboard

### 1. Agent Login & Role Verification
- **Scenario:** The agent logs into the platform and is correctly routed to the Agent portal.
- **Steps:**
  1. Navigate to the Trimma login page.
  2. Enter the credentials of the test Agent account.
  3. Verify that upon successful login, the system redirects to `/agent`.
- **Expected Result:** The agent successfully accesses the Agent Dashboard and cannot access `/admin` routes.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 2. Dashboard Metrics & Overview
- **Scenario:** The dashboard displays accurate, real-time metrics for the agent.
- **Steps:**
  1. View the main dashboard (`/agent`).
  2. Check the high-level metric cards (e.g., Total Leads, Active Salons, Pending Tasks, Commissions).
- **Expected Result:** Metrics load without errors and accurately reflect the agent's current data state.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 2: Territory Management

### 3. View Assigned Territories
- **Scenario:** The agent can view the specific districts/cities they are assigned to.
- **Steps:**
  1. Navigate to the **Territories** section (`/agent/territory`).
  2. Review the list of assigned territories.
- **Expected Result:** Only the territories explicitly assigned to this agent by the Admin are visible.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 3: Lead Discovery & Management

### 4. Create a New Salon Lead (Discovery)
- **Scenario:** The agent manually inputs a new salon they discovered in the field.
- **Steps:**
  1. Navigate to the **Discover** or **Leads** section.
  2. Click "Add New Lead" or "Create Lead".
  3. Fill out the required details (Salon Name, Phone Number, Owner Name, District) and submit.
- **Expected Result:** The lead is successfully created, appears in the agent's pipeline as "New" or "Discovered", and is recorded in the database.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 5. Update Lead Status / Pipeline Movement
- **Scenario:** The agent updates the status of a lead after contacting them.
- **Steps:**
  1. Navigate to **Leads** (`/agent/leads`).
  2. Select an existing lead.
  3. Change the status from "New" to "Contacted" or "Meeting Scheduled".
  4. Add a log/note regarding the interaction.
- **Expected Result:** The status change is saved successfully, and the note is appended to the lead's activity history.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 4: Salon Onboarding & Approvals

### 6. Convert Lead to Salon Onboarding
- **Scenario:** A lead agrees to join Trimma, and the agent begins the formal onboarding process.
- **Steps:**
  1. Open a highly qualified lead in the Leads dashboard.
  2. Click "Convert to Salon" or "Start Onboarding".
  3. Fill in any missing mandatory business details required for account creation.
- **Expected Result:** The lead is marked as "Converted", and a new Salon entity is created in "Pending" or "Draft" onboarding status.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 7. Trigger Salon Owner Onboarding Invite
- **Scenario:** The agent sends the platform invite link to the salon owner.
- **Steps:**
  1. Navigate to the **Salons** section (`/agent/salons`).
  2. Open the newly converted salon.
  3. Click "Send Onboarding Invite".
- **Expected Result:** 
  - A success toast appears.
  - *Trigger Check:* The Salon Owner receives the Onboarding Invitation Email and WhatsApp message.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 8. Agent Approval (Go-Live)
- **Scenario:** The salon has completed their profile setup, and the agent approves them to go live.
- **Steps:**
  1. Open a salon that has finished setup.
  2. Click "Approve Salon" or mark them as "Active".
- **Expected Result:**
  - The salon's status changes to `active`.
  - *Trigger Check:* The Salon Owner receives the "Agent Approval" notification (Email/WhatsApp).
  - *Trigger Check:* The Platform Admin receives the internal approval confirmation email.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 5: Tasks & Daily Workflow

### 9. Create and Complete Tasks
- **Scenario:** The agent schedules a follow-up task and marks it as complete.
- **Steps:**
  1. Navigate to **Tasks** (`/agent/tasks`).
  2. Create a new task (e.g., "Follow up with Salon X on Friday").
  3. Once created, click the checkbox to mark the task as "Complete".
- **Expected Result:** The task is created successfully and, upon completion, moves to the completed list or is crossed out.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 6: Commissions & Earnings

### 10. View Commission Ledger
- **Scenario:** The agent checks their expected earnings from onboarded salons.
- **Steps:**
  1. Navigate to **Commissions** (`/agent/commissions`).
  2. Review the commission ledger.
- **Expected Result:** The ledger accurately displays earnings generated from salons onboarded by this agent (if applicable based on the active commission structure). The status of payouts (Pending vs Paid) should be visible.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 7: Agent Profile Management

### 11. Update Agent Profile
- **Scenario:** The agent updates their personal contact details.
- **Steps:**
  1. Navigate to **Profile** (`/agent/profile`).
  2. Update the phone number or profile picture.
  3. Click Save.
- **Expected Result:** The profile updates successfully and changes persist after a page refresh.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## UAT Sign-off
- **Tested By:** _________________________
- **Date:** _________________________
- **Overall Status:** `[ ] Approved` / `[ ] Requires Re-work`
