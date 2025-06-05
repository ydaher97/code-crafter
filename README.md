
# CodeCrafter: AI-Powered Interactive Learning Platform

CodeCrafter is a Next.js application designed to help users learn software development concepts and coding skills interactively with the assistance of Generative AI. Users can select topics and difficulty levels, receive coding or conceptual questions, submit their answers, and get instant feedback and solutions.

## ✨ Features

*   **AI-Powered Question Generation**: Generates coding and conceptual questions based on selected topic and difficulty.
*   **Topic Suggestion**: AI suggests relevant topics based on chosen difficulty.
*   **Interactive Challenge Environment**:
    *   Dedicated page for attempting challenges.
    *   Separate input areas for coding and conceptual answers.
    *   Hints available for questions.
*   **AI-Driven Grading**:
    *   Submissions are graded by an AI, providing a score and constructive feedback.
*   **Solution Generation**: If a user fails a challenge, the AI can provide a correct solution and an explanation.
*   **User Authentication**: Secure sign-up and sign-in using Firebase Authentication (Email & Password).
*   **Challenge History**: Logged-in users can view their past challenge attempts, including the question, their solution, AI feedback, and the generated solution if applicable.
*   **Progress Tracking & Profile Page**:
    *   Users have a profile page displaying their overall performance statistics.
    *   Breakdown of performance by topic and difficulty.
*   **Gamification (Badges)**:
    *   Users earn badges for achievements like passing their first challenge or mastering a certain number of challenges at a specific difficulty.
    *   Earned badges are displayed on the profile page.
*   **Responsive UI**: Built with ShadCN UI components and Tailwind CSS for a modern and responsive user experience.

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI**: React
*   **Styling**: Tailwind CSS
*   **UI Components**: ShadCN UI
*   **Generative AI**: Google Gemini models via Genkit
*   **Backend & Authentication**: Firebase (Auth, Firestore)
*   **State Management**: React Context API, `useState`, `useEffect`
*   **Forms**: React Hook Form (implicitly via ShadCN or custom)
*   **Linting/Formatting**: ESLint, Prettier (assumed, standard for Next.js)

## 🚀 Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn
*   A Firebase project

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-folder-name>
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of your project by copying `.env.example` (if one exists) or by creating it manually. You'll need to populate it with your Firebase project configuration and any other necessary API keys (like for Google AI Studio if using Genkit with specific keys).

Example `.env` structure:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# For Genkit (if needed directly, though often configured in code/Google Cloud Project)
# GOOGLE_API_KEY=your_google_ai_studio_api_key
```

### 4. Firebase Setup

*   **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
*   **Add a Web App**: In your Firebase project settings, add a new Web App. Firebase will provide you with the configuration values (apiKey, authDomain, etc.) needed for your `.env` file.
*   **Enable Authentication**: In the Firebase console, navigate to "Authentication" (under Build) -> "Sign-in method" tab, and enable the "Email/Password" provider.
*   **Enable Firestore**: Navigate to "Firestore Database" (under Build) and create a database. Start in **test mode** for initial development (which has open security rules) or set up production rules immediately.
    *   **Security Rules for Firestore**: Ensure you have appropriate security rules. For development, you might start with more open rules, but for production, they should be secure. Example rules for `challengeHistory` and `userAchievements`:
        ```javascript
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /challengeHistory/{docId} {
              allow read: if request.auth != null && request.auth.uid == resource.data.userId;
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
              allow update, delete: if false;
            }
            match /userAchievements/{docId} {
              allow read: if request.auth != null && request.auth.uid == resource.data.userId;
              allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
              allow update, delete: if false;
            }
          }
        }
        ```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

This will start the Next.js development server, typically on `http://localhost:3000`.

### 6. Run Genkit (for AI features)

In a separate terminal, you may need to start the Genkit development server if you're actively developing or testing AI flows locally:

```bash
npm run genkit:dev
# or
npm run genkit:watch # (if you want it to watch for changes in AI flow files)
```
This typically starts Genkit on `http://localhost:3100`.

## 📄 Project Structure (Key Directories)

*   `src/app/`: Contains the main pages and layouts (App Router).
*   `src/ai/`: Genkit AI flows and configuration.
    *   `flows/`: Individual AI flows (e.g., question generation, grading).
*   `src/components/`: Reusable UI components.
    *   `ui/`: ShadCN UI components.
    *   `layout/`: Layout components like Header and Footer.
    *   `code-crafter/`: Application-specific components for the core CodeCrafter experience.
*   `src/contexts/`: React Context providers (e.g., `AuthContext`).
*   `src/hooks/`: Custom React hooks.
*   `src/lib/`: Utility functions, Firebase configuration, achievement definitions.
*   `public/`: Static assets (e.g., images, favicons).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE.md file (if applicable) for details. (Assuming MIT, adjust if different).
# code-crafter
