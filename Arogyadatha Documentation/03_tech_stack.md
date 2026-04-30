# Deliverable 3: Tech Stack Documentation

The Arogyadatha platform utilizes a state-of-the-art tech stack focused on security, speed, and real-time collaboration.

## 1. Programming Languages
*   **TypeScript (~5.8.2)**: Used for all application logic to ensure type safety and reduce production bugs.
*   **JavaScript (ESNext)**: Target output for browser execution.

## 2. Core Frameworks & Libraries
*   **React (19.0.0)**: The core UI library for component-based architecture.
*   **Vite (6.2.0)**: Modern build tool and development server for lightning-fast HMR.
*   **React Router Dom (7.14.0)**: Advanced client-side routing.
*   **TailwindCSS (4.1.14)**: Utility-first CSS framework for custom, premium styling.

## 3. Backend & Infrastructure (Firebase Suite)
*   **Firebase SDK (12.12.0)**:
    *   **Firestore**: Real-time NoSQL database.
    *   **Auth**: Secure user identity management.
    *   **Storage**: Cloud storage for medical documents.
    *   **Hosting**: Static asset hosting with CDN support.

## 4. Artificial Intelligence
*   **@google/genai (1.49.0)**: Direct integration with Google Gemini (Pro/Flash) for:
    *   Multilingual Symptom Analysis.
    *   Medical Report Simplification.
    *   Clinical Decision Support.

## 5. UI Components & Aesthetics
*   **Lucide React (0.546.0)**: Consistent, high-quality icon set.
*   **Motion (12.23.24)**: (Formerly Framer Motion) for advanced animations.
*   **Shadcn UI (4.2.0)**: Accessible, high-quality component foundations.
*   **Sonner (2.0.7)**: Premium toast notification system.
*   **Geist Mono/Sans**: Modern typography.

## 6. Utilities & Tools
*   **XLSX (0.18.5)**: Used for exporting medical data and lab inventories to Excel.
*   **Dotenv**: Environment variable management.
*   **Class Variance Authority (CVA)**: For managing complex component styles.
*   **Tailwind Merge / Clsx**: For dynamic CSS class management.

## 7. Testing & Quality Assurance
*   **Playwright (1.59.1)**: Used for end-to-end (E2E) testing and browser automation to verify critical user journeys (Sign up, Booking).
*   **ESLint / Prettier**: Code linting and formatting.

## 8. Deployment Stack
*   **Development**: Local Vite server (`npm run dev`).
*   **Production Build**: Optimized bundle via `vite build`.
*   **Hosting Target**: Firebase Hosting or equivalent static hosting.
*   **Repository**: Git-based version control.
