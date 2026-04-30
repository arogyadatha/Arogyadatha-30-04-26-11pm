# Deliverable 6: Database Schema Documentation

Arogyadatha uses a document-oriented NoSQL schema in **Google Cloud Firestore**. This document outlines the core collections and their relationships.

## 1. Top-Level Collections

### `users`
Central registry of all authenticated users.
*   **Fields**: `uid` (string), `email` (string), `fullName` (string), `role` (enum: patient/doctor/hospital/lab/pharmacy/admin), `phoneNumber` (string), `arogyadathaId` (string), `createdAt` (timestamp).

### `patients`
Extended data and sub-collections for patient users.
*   **Fields**: `uid`, `dob`, `address`, `city`, `state`.
*   **Sub-collection: `cases`** (The core of the Health Journey).
    *   **Fields**: `caseId` (string, sequential), `caseName`, `symptoms`, `status` (active/completed/cancelled), `createdAt`, `updatedAt`.
    *   **Sub-collection: `appointments`**: Specific appointments linked to this case.
    *   **Sub-collection: `labRequests`**: Tests ordered by a doctor for this case.
    *   **Sub-collection: `labReports`**: Results uploaded by a lab for this case.
    *   **Sub-collection: `pharmacyOrders`**: Medicine orders linked to this case.

### `doctors`
*   **Fields**: `uid`, `specialization`, `experience`, `registrationNumber`, `consultationFee`, `availability` (object), `rating`, `profileImage`.

### `hospitals`
*   **Fields**: `hospitalCode`, `hospitalName`, `address`, `city`, `district`, `state`, `latitude`, `longitude`, `departments` (array), `isVerified` (boolean).

### `labs`
*   **Fields**: `labName`, `address`, `licenseNumber`, `testsAvailable` (Sub-collection).
*   **Sub-collection: `tests`**: `testName`, `category`, `price`, `duration`, `method`.

### `pharmacies`
*   **Fields**: `pharmacyName`, `address`, `medicinesAvailable` (Sub-collection).
*   **Sub-collection: `medicines`**: `medicineName`, `composition`, `mrp`, `manufacturer`.

### `appointments`
Flat collection for cross-role visibility (Doctor + Patient).
*   **Fields**: `id`, `patientId`, `doctorId`, `caseId`, `type` (Online/Offline), `dateTime`, `status` (Pending/Completed), `prescription` (string/ID).

## 2. Shared & Support Collections
*   **`counters`**: Used for global sequential ID generation.
*   **`doctor_feedback`**: `patient_id`, `doctor_id`, `rating`, `comment`, `createdAt`.
*   **`meta`**: Internal system configuration and feature flags.

## 3. Relationships & Links
| Relationship Type | Source | Target | Key |
| :--- | :--- | :--- | :--- |
| **One-to-Many** | `patients` | `cases` | `patientId` |
| **One-to-Many** | `cases` | `appointments` | `caseId` |
| **Many-to-One** | `appointments` | `doctors` | `doctorId` |
| **One-to-Many** | `labs` | `tests` | `labId` |
| **Many-to-One** | `labRequests` | `labs` | `labId` |

## 4. Storage Strategy
*   **Transactional Data**: Firestore.
*   **Binary Files**: Firebase Storage (mapped via `reportUrl` or `profileImage` string fields in Firestore).
*   **Real-time Logic**: Uses Firebase Transactions to ensure Case ID uniqueness per patient.

## 5. Security Model (Rules Mapping)
*   **Ownership**: Users can only write to their own documents (match `request.auth.uid`).
*   **Role-Based Read**: Admins can read all collections; Doctors can read patient files ONLY if an appointment exists (or specific shared state).
*   **Sequential Integrity**: Transactions handle the increment of Case numbers in the `meta` sub-collection.
