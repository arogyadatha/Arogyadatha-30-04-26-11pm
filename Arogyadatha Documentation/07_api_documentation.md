# Deliverable 7: API Documentation

Arogyadatha primarily uses a **Serverless Service Architecture**. Instead of a traditional REST API, the frontend communicates directly with managed services via secure SDKs.

## 1. Core Firebase Services (SDK APIs)

### Authentication API
*   **Purpose**: User registration and secure login.
*   **Endpoints used**:
    *   `createUserWithEmailAndPassword`
    *   `signInWithEmailAndPassword`
    *   `signInWithPopup` (Google OAuth)
    *   `signOut`
*   **Auth Requirements**: JWT tokens managed automatically by Firebase.

### Cloud Firestore API (Data)
*   **Purpose**: Real-time CRUD operations for healthcare data.
*   **Key Operations**:
    *   `runTransaction`: Used for atomic Case ID generation.
    *   `onSnapshot`: Real-time listeners for updates.
    *   `query/where`: Filtering doctors and labs.

## 2. AI Intelligence APIs (Google Gemini)
*   **Service**: `@google/genai`
*   **Model**: Gemini 2.0 Flash / Pro
*   **Integrated Features**:
    1.  **Symptom Analyzer**:
        *   *Input*: Raw text description of symptoms.
        *   *Output*: Urgency level, possible conditions, and recommended specialist.
    2.  **Smart Report Interpreter**:
        *   *Input*: Extracted text from medical reports.
        *   *Output*: Simple summary in Telugu and English.

## 3. Third-Party Integrations

### Geocoding API (OpenStreetMap)
*   **Endpoint**: `https://nominatim.openstreetmap.org/search`
*   **Purpose**: Converting hospital addresses into Latitude/Longitude coordinates for the map-based search.
*   **Usage**: Triggered during admin bulk onboarding.

### Geolocation API (Browser)
*   **Purpose**: Detecting the patient's current city to show local diagnostic labs and pharmacies.

## 4. Internal Service Layer (Business Logic)
While not exposed as external endpoints, these service modules act as the internal API for the UI:
*   **Case Service (`caseService.ts`)**: 
    *   `createCase(patientId, name, symptoms)`
    *   `getPatientCases(patientId)`
    *   `markCaseAsCompleted(patientId, caseId)`

## 5. Security & Authentication Requirements
*   **Strict UID Check**: All data requests are filtered by the Firebase `uid` to ensure privacy.
*   **API Key Protection**: The Gemini API key is managed via Vite environment variables (`VITE_GEMINI_API_KEY`).
*   **Domain Whitelisting**: Restricted to verified production domains in the Firebase Console.

## 6. Missing / Needed APIs
*   **SMS Gateway**: For patient arrival alerts (OTP-based).
*   **Payment Gateway**: Integration for consultation fee processing (e.g., Razorpay/Stripe).
*   **Video SDK**: Dedicated API for secure teleconsultations (e.g., Jitsi/Agora).
