# Deliverable 9: Security & Scalability Review

This document evaluates the current technical standing of Arogyadatha regarding data protection and its ability to handle growth.

## 1. Security Model
The system uses a **Defense-in-Depth** strategy:

### Authentication
*   **Provider**: Firebase Auth (Google Cloud Identity).
*   **Features**: Secure JWT tokens, automatic session management, and multi-factor authentication (MFA) readiness.
*   **Role-Based Security**: Role is stored in a `users` collection and verified during the login flow.

### Data Privacy (Firestore Rules)
*   **Granular Access**: `firestore.rules` ensures that a patient's medical records are inaccessible to any other user unless specifically shared (via the appointment/case relationship).
*   **Admin Protection**: Only verified admin UIDs (e.g., `arogyadatha24@gmail.com`) can access global stakeholders' data.
*   **Write Protection**: Use of `isOwner()` function prevents any user from modifying another person's profile or case.

### AI Safety
*   **Controlled Context**: The system explicitly instructs the AI that it is an "assistant" and not a replacement for emergency medical services.
*   **Anonymization**: Clinical data is processed via the Gemini API using secure, encrypted channels (HTTPS).

## 2. Scalability Readiness
The architecture is inherently **Elastic**:

*   **Database (Firestore)**: Scales automatically from 10 to 10 million users without manual sharding or infrastructure management.
*   **Frontend (Vite/React)**: Assets are served via a global CDN (Firebase Hosting), ensuring low latency regardless of traffic volume.
*   **AI (Gemini)**: Google's AI infrastructure handles large-scale natural language processing requests.
*   **Concurrency**: Use of Firestore Transactions in `caseService.ts` ensures that even if thousands of patients create cases simultaneously, ID integrity is maintained.

## 3. Potential Risks
1.  **Client-Side Logic**: Some complex clinical business logic resides on the client. As the system grows, moving sensitive calculations to Firebase Cloud Functions (Backend) is recommended.
2.  **Report Storage**: Medical reports are large files. While Firebase Storage scales, cost management (lifecycle rules) will be needed as the archive grows into petabytes.
3.  **Role Verification**: Currently, role verification depends on a specific email address in rules. A more robust "Admin" collection-based check is preferred for larger teams.

## 4. Migration Readiness (Multi-Cloud)
The codebase is highly modular:
*   **AWS Migration**: Frontend can be deployed to AWS Amplify/S3+CloudFront. Firestore can be migrated to DynamoDB (with logic adjustment) or AWS AppSync.
*   **Azure Migration**: Compatible with Azure Static Web Apps and Azure CosmosDB (NoSQL).
*   **Self-Hosting**: The React app is platform-agnostic. The Firebase dependencies would need to be replaced with a custom Node.js/PostgreSQL backend if total self-hosting is required.

## 5. Security Recommendations
*   **Audit Logging**: Fully implement the `audit-logs` collection to track who accessed which patient's clinical history.
*   **Encryption at Rest**: Already provided by Google Cloud, but field-level encryption for extremely sensitive data (e.g., HIV status) could be added.
*   **Strict CORS**: Ensure `vite.config` and Firebase are locked down to specific production domains.
