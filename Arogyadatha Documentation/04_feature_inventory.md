# Deliverable 4: Full Feature Inventory (A–Z)

This document lists all features discovered in the Arogyadatha codebase, categorized by user role and module.

## 1. Patient Portal Features
*   **AI Symptom Checker**: Real-time analysis of symptoms using Gemini AI with urgency scoring and specialist recommendations.
*   **Health Journey Timeline**: A sequential view of medical progress (Case ID based) tracking doctor visits, tests, and prescriptions.
*   **Sequential Case ID Management**: Ability to create and track specific "cases" (e.g., CASE-001) for distinct medical issues.
*   **Doctor Booking**: Search and filter verified doctors by specialty, experience, and fee. Supports Online/Offline modes.
*   **Lab Booking & Comparison**: Search for diagnostic tests, compare prices across labs, and book appointments.
*   **Smart Report Viewer**: AI-assisted simplification of complex lab reports into plain Telugu and English.
*   **Pharmacy & Medicine Tracking**: Order medicines via prescriptions and manage a digital dosage schedule.
*   **Location-Based Services**: Automatic detection of nearby hospitals and labs via browser geolocation.
*   **Arogya Chatbot**: Multilingual rule-based assistant for quick navigation and support (slang-optimized).
*   **Health Score Dashboard**: Visual representation of health status and system activity.

## 2. Doctor Dashboard Features
*   **Patient Queue Management**: View and manage appointments for the day with real-time status updates (Consulted/Requested).
*   **Clinical History View**: Secure access to patient's previous cases, reports, and prescriptions (bound by permissions).
*   **Digital Prescription (Rx) Builder**: Interface to prescribe medicines, set dosages, and order lab tests directly.
*   **Case Tracking**: Ability to see a patient's entire "Health Journey" for a specific Case ID.
*   **Revenue Analytics**: Track consultation earnings and patient volume.
*   **Profile Management**: Update specialty, fees, availability, and surgery history.

## 3. Lab Dashboard Features
*   **Test Request Management**: View incoming lab test requests from doctors or patients.
*   **Report Digitization**: Upload PDF/Image reports directly to a patient's specific Case ID.
*   **Inventory Management**: Manage the catalog of available tests and their pricing.
*   **Bulk Upload**: (Admin feature) Import lab directories and test catalogs.

## 4. Pharmacy Dashboard Features
*   **Prescription Processing**: View and fulfill medicine orders shared by patients.
*   **Order Tracking**: Manage dispatch logistics and delivery status.
*   **Medicine Catalog**: Maintain inventory of available drugs and health products.

## 5. Super Admin / Admin Features
*   **Ecosystem Overview**: Global statistics for hospitals, doctors, patients, labs, and pharmacies.
*   **Bulk Onboarding**: Massive import of stakeholder data via Excel/XLSX with automatic password generation.
*   **Global Geocoding Sync**: Automated coordination sync for hospitals using OpenStreetMap API to enable location-based search.
*   **Account Lifecycle Management**: Verification, suspension (soft delete), and permanent deletion of any user role.
*   **Credential Management**: Securely manage access for hospitals and partner networks.
*   **Audit Trail**: (Placeholder found in code) Tracking system-wide changes and administrative actions.

## 6. System-Wide / Infrastructure Features
*   **Multilingual Support**: Toggle between English and Telugu (Slang) across the entire UI.
*   **Smart Login**: Auto-detection of roles based on input (Email/Phone) to streamline the login experience.
*   **Theme Management**: Dark Mode / Light Mode support.
*   **Security Key System**: (Found in login logic) Secondary security layer for sensitive accounts.
*   **Real-time Notifications**: Bell notification system for appointment updates and report arrivals.
*   **Feedback System**: Patient feedback loops for doctor ratings.

## 7. Placeholder / Future Features (Found in Code)
*   **Blood Bank Integration**: Links for blood donation and requests (partial UI found).
*   **Subscription Engine**: Tiered access for hospitals (logic foundations in Admin dashboard).
*   **Advanced Analytics**: Predictive health scores based on Case History.
*   **Video Consultation**: Integration hooks for online video calls.
