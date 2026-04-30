# Deliverable 10: Gap Analysis / What Is Missing

This document provides a critical review of the current codebase, highlighting missing features, incomplete modules, and technical risks.

## 1. Feature Gaps (Incomplete/Missing)
*   **Audit Logging**: While the UI has an "Audit Trail" button and a collection mapping for `audit-logs`, the actual implementation of logging system-wide events (who changed what) is not yet globally integrated.
*   **Blood Bank**: Mentioned in the landing page and translations, but no dedicated component or database collection exists to handle blood requests/donations.
*   **Hospital Subscription Logic**: The Admin Dashboard has placeholders for "Subscriptions," but the actual recurring billing logic and tier-based feature gating are missing.
*   **Doctor Availability Management**: The UI has basic fields, but a robust calendar-based "Leave Management" or "Holiday" system for independent doctors is not fully implemented.
*   **In-App Messaging**: There is no direct real-time chat between patients and doctors (beyond the Arogya Chatbot). Users currently rely on external WhatsApp links.

## 2. Technical Debt & Risks
*   **Lack of Backend Functions**: All Firestore logic (including sensitive transactions like Case ID generation) is currently client-side. This is a security risk as it exposes business logic and increases the attack surface. 
    *   *Solution*: Move Case ID generation and stakeholder onboarding to **Firebase Cloud Functions**.
*   **Environment Variable Safety**: The Gemini API key is currently accessed via `import.meta.env`. While standard for Vite, for a production healthcare app, these should be proxied through a secure backend to prevent key exposure.
*   **Error Handling**: Many service calls use a basic `try/catch` with `console.error`. A more unified error tracking system (like Sentry or custom Firestore error logging) is needed for production.
*   **Mobile-First Optimization**: While the app uses Tailwind, some complex dashboards (Doctor/Admin) are data-heavy and may require specialized mobile views to remain usable on smaller screens.

## 3. Data Integrity Concerns
*   **Case Deletion**: `caseService.ts` implements a "Soft Delete" by setting status to `cancelled`, but the Admin Dashboard has a "Permanent Delete" option. Mixing these can lead to orphaned records in sub-collections.
*   **Address Geocoding**: The OSM Nominatim API used for geocoding is excellent but has rate limits and "Usage Policy" restrictions. For a large-scale hospital network, a commercial provider (Google Maps/Mapbox) will be needed.

## 4. UI/UX Polishing Needed
*   **Offline Mode**: Since this app targets Indian patients who may have spotty internet, a proper PWA (Progressive Web App) implementation with offline caching for medical history is missing.
*   **Accessibility**: While Lucide icons and Geist fonts are used, a full WCAG accessibility audit for screen readers is needed for elderly patients.

## 5. Strategic Gaps (Product Growth)
*   **Emergency Mode**: No "One-Tap Emergency" feature to share current medical ID with local paramedics.
*   **Family Profiles**: Patients cannot currently manage profiles for their children or elderly parents under a single account.
*   **Pharmacy Inventory**: Direct API integration with local pharmacy inventory systems (POS) is not yet present; orders are currently one-way requests.
