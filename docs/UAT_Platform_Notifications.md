# Trimma Notifications - User Acceptance Testing (UAT) Document

This document outlines the test cases required to validate the 14 automated notification triggers across the Trimma platform. All tests will verify that notifications are successfully delivered via **WhatsApp (Meta Cloud API)** and **Email (Resend API -> Gmail)**.

## Pre-requisites for Testing
- Access to the **Customer Web Portal**, **Salon Dashboard**, and **Admin/Agent Dashboard**.
- A test customer account with a valid Gmail address and a test phone number registered for WhatsApp.
- A test salon owner account with a valid Gmail address and a test phone number registered for WhatsApp.
- A test agent/admin account.
- Test Stripe cards for simulating payments (if applicable in your environment).

> [!NOTE]
> Since Resend is being tested with Gmail, ensure that your sender domain is properly verified or that the recipient Gmail addresses are added to your Resend allowed test list (if your domain is not fully verified yet).

---

## Section 1: Customer Booking Lifecycle (Reservation Flow)

### 1. Reservation Payment Received
- **Scenario:** A customer pays the 30% reservation fee for a booking to lock the slot.
- **Steps:**
  1. Log in as a customer and select a salon that requires a 30% reservation fee.
  2. Proceed to checkout and complete the payment using a test card.
  3. Verify the booking status changes to "Reserved".
- **Expected Result:**
  - **Email:** The customer receives a "Reservation Payment Received" email at their Gmail.
  - **WhatsApp:** The customer receives the "Reservation Payment Received" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 2. Booking Confirmed by Salon
- **Scenario:** The salon owner manually confirms a reserved booking from their dashboard.
- **Steps:**
  1. Log in as the salon owner.
  2. Navigate to the bookings dashboard and find the "Reserved" booking.
  3. Click "Confirm Booking".
- **Expected Result:**
  - **Email:** The customer receives a "Booking Confirmed" email at their Gmail.
  - **WhatsApp:** The customer receives the "Booking Confirmed by Salon" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 3. Booking Rescheduled
- **Scenario:** A booking is rescheduled to a new date/time by the salon owner or admin.
- **Steps:**
  1. Log in as the salon owner (or admin).
  2. Open an existing confirmed/reserved booking.
  3. Change the date and time, and save/approve the reschedule request.
- **Expected Result:**
  - **Email:** The customer receives a "Booking Rescheduled" email at their Gmail containing the new date and time.
  - **WhatsApp:** The customer receives the "Booking Rescheduled Alert" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 4. Booking Cancelled
- **Scenario:** The salon owner cancels a booking from their dashboard.
- **Steps:**
  1. Log in as the salon owner.
  2. Open an existing booking.
  3. Click "Cancel Booking" and provide a reason (if prompted).
- **Expected Result:**
  - **Email:** The customer receives a "Booking Cancelled" email at their Gmail.
  - **WhatsApp:** The customer receives the "Booking Cancelled Alert" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 5. Review Request (Feedback Prompt)
- **Scenario:** The salon owner marks an appointment as "Completed".
- **Steps:**
  1. Log in as the salon owner.
  2. Open a booking that is currently ongoing or confirmed.
  3. Mark the booking status as "Completed".
- **Expected Result:**
  - **Email:** The customer receives an email prompting them to leave a review.
  - **WhatsApp:** The customer receives the "Feedback Review Prompt" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 2: Legacy Booking Flow (Pending Bookings)

### 6. New Booking — Customer (Pending)
- **Scenario:** A customer creates a booking using the legacy/pending flow without immediate payment.
- **Steps:**
  1. Log in as a customer and select a salon using the legacy booking system.
  2. Request a time slot and submit the booking.
- **Expected Result:**
  - **Email:** The customer receives a "Pending Booking Request" email at their Gmail.
  - **WhatsApp:** The customer receives the "New Booking — Customer (Pending)" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 7. New Booking — Salon Owner
- **Scenario:** A new pending booking request is sent to the salon owner.
- **Steps:**
  1. Execute the steps from Test #6 (Customer creating a pending booking).
- **Expected Result:**
  - **Email:** The salon owner receives a "New Booking Request" email at their Gmail.
  - **WhatsApp:** The salon owner receives the "New Booking — Salon Owner Alert" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 3: Salon Onboarding & Agent Approvals

### 8. Salon Owner Onboarding Invite
- **Scenario:** An admin or agent sends a partner login invitation after validating a salon.
- **Steps:**
  1. Log in as an admin or field agent.
  2. Navigate to the leads/onboarding dashboard.
  3. Trigger the onboarding invite for a verified salon lead.
- **Expected Result:**
  - **Email:** The salon owner receives a "Salon Onboarding Invitation" email with a link to set up their account.
  - **WhatsApp:** The salon owner receives the "Salon Onboarding Invitation" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 9. Agent Approval — Salon Owner
- **Scenario:** An agent formally approves a salon to go live on the Trimma platform.
- **Steps:**
  1. Log in as a field agent.
  2. Navigate to a salon's profile in the agent dashboard.
  3. Click "Approve Salon" (or set status to Live/Approved).
- **Expected Result:**
  - **Email:** The salon owner receives an "Approval Confirmation" email.
  - **WhatsApp:** The salon owner receives the "Agent Approval — Salon Owner" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 10. Agent Approval — Platform Admin
- **Scenario:** Internal notification sent to the platform administrators when an agent approves a salon.
- **Steps:**
  1. Execute the steps from Test #9 (Agent approving a salon).
- **Expected Result:**
  - **Email:** The Platform Admin receives an internal email summarizing the newly approved salon and the approving agent's details.
  - **WhatsApp:** Not applicable / or internal admin WhatsApp notification.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 4: Verified Badge Grants

### 11. Verified Badge — Salon Owner
- **Scenario:** The platform admin grants the official "Verified" badge to a salon.
- **Steps:**
  1. Log in as the Platform Admin.
  2. Navigate to a specific salon's management page.
  3. Toggle/Grant the "Verified Badge".
- **Expected Result:**
  - **Email:** The salon owner receives a celebratory email that they are now verified.
  - **WhatsApp:** The salon owner receives the "Verified Badge" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 12. Verified Badge — Admin Confirmation
- **Scenario:** Internal confirmation logged to the admin after successfully granting a badge.
- **Steps:**
  1. Execute the steps from Test #11.
- **Expected Result:**
  - **Email:** The Admin receives an internal confirmation email that the verified badge was successfully granted and the salon notified.
  - **WhatsApp:** Not applicable / or internal admin WhatsApp notification.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## Section 5: Account Creation & Lead Management

### 13. Welcome — New Customer
- **Scenario:** A customer completes their sign-up and logs in successfully for the first time.
- **Steps:**
  1. Open the customer app/website as a new user.
  2. Enter a phone number, receive OTP, and complete the profile registration.
- **Expected Result:**
  - **Email:** The customer receives a "Welcome to Trimma" email.
  - **WhatsApp:** The customer receives the "Welcome — New Customer" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

### 14. Lead Assigned — Field Agent
- **Scenario:** A new salon lead is assigned to a specific field agent (either via automated discovery or manually by an admin).
- **Steps:**
  1. Log in as an admin.
  2. Navigate to the Leads dashboard.
  3. Create a new lead or select an unassigned lead and assign it to a Field Agent.
- **Expected Result:**
  - **Email:** The assigned field agent receives an email detailing the new lead.
  - **WhatsApp:** The assigned field agent receives the "Lead Assigned" template on WhatsApp.
- **Status:** `[ ] Pass` / `[ ] Fail`

---

## UAT Sign-off
- **Tested By:** _________________________
- **Date:** _________________________
- **Overall Status:** `[ ] Approved` / `[ ] Requires Re-work`
