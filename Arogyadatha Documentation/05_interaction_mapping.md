# Deliverable 5: Keyboard / Inputs / User Interaction

This document maps all user interaction points, inputs, and form logic across the Arogyadatha platform to ensure a consistent UX understanding.

## 1. Universal Interactions
*   **Search Header (App.tsx)**: Global search for doctors, labs, and pharmacies. Logic: Triggered by `/` keyboard shortcut or click. Filters results in real-time.
*   **Language Toggle**: Switch between English and Telugu. Persists choice in `localStorage` (`arogya_lang`).
*   **Smart Login Input**: 
    *   **Type**: Email or Phone number.
    *   **Logic**: Automatically detects the user's role before they even click "Verify Identity."
    *   **Auto-Complete**: Remembers the last login identifier in `localStorage`.

## 2. Patient Specific Interactions
### Symptom Checker (SymptomChecker.tsx)
*   **Detailed Symptom Input**: Multi-line `textarea` for free-text description of feelings.
*   **Interactive Analysis**: AI-powered analysis with multi-step progressive loading (Analyze -> Review -> Conditions -> Specialists).

### Doctor Booking (BookDoctor.tsx)
*   **Doctor Search**: Filter by name or specialty.
*   **Specialty Chips**: Quick-tap categories (General, Cardiology, etc.).
*   **Booking Modal**: 
    *   `Select` for Appointment Type (Online/Offline).
    *   `Input` for Date and Time.

### Health Journey (HealthJourney.tsx / CreateCaseModal.tsx)
*   **Case Creation Form**:
    *   `Input`: Case Name (e.g., "Knee Pain").
    *   `Textarea`: Initial Symptoms.
    *   **Logic**: Sequential `CASE-00X` generation with duplicate prevention (`findSimilarCase`).

### Arogya Chatbot (ArogyaChatbot.tsx)
*   **Voice/Mic Input**: Speech-to-Text integration for hands-free query entry. Logic: Uses `webkitSpeechRecognition`.
*   **Slang-Optimized Chips**: Quick-action buttons in colloquial Telugu for easier interaction for semi-literate users.

## 3. Doctor Specific Interactions
### Digital Prescription Builder (DoctorDashboard.tsx)
*   **Medicine Form**:
    *   `Input`: Medicine Name (Autosuggest).
    *   `Select`: Dosage (mg/ml).
    *   `Checkbox`: Frequency (Morning, Afternoon, Night).
    *   `Radio`: Food relationship (Before/After).
    *   `Input`: Duration (Days/Weeks).
*   **Lab Request Multi-select**: Checkbox list of common diagnostic tests.

## 4. Admin Specific Interactions
### Provider Onboarding (AdminDashboard.tsx)
*   **Bulk Upload**: Drag-and-drop or file picker for `.xlsx` files. Logic: Processes headers like "Hospital Name," "Gmail/Email," and "Latitude/Longitude."
*   **Manual Hospital Form**:
    *   10+ fields including `hospitalCode`, `latitude`, `longitude`, and comma-separated `departments`.
*   **Global Sync**: Button to trigger massive background geocoding using the OpenStreetMap API for hospitals missing coordinates.

## 5. Summary of Interaction Components
| Component Type | Examples |
| :--- | :--- |
| **Search Inputs** | Global Search, Doctor List Search, Lab Inventory Search. |
| **Forms** | Signup (Email/ID, Key), Profile Update, Case Creation, Prescription Builder. |
| **Filters** | Specialty Chips, City Selectors, Date Range Filters. |
| **Special Inputs** | Voice (Mic), File Upload (Reports/Profile), Geolocation Prompts. |
| **Modals** | Booking Confirmations, Case Creation, Report Viewers. |

## 6. Logic Flow for Critical Inputs
1.  **Case ID Validation**: Every booking or report upload MUST be linked to an active `Case ID`. The system prompts the user to "Create Case" if one doesn't exist for the current interaction.
2.  **Auth Persistence**: Login inputs are cached to reduce friction for returning users.
3.  **Real-time Validation**: Forms use immediate feedback (Sonner toasts) for errors like invalid emails or missing required fields.
