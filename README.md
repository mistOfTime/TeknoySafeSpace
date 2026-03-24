# Teknoy SafeSpace

A secure student well-being community platform. Personal emails (Gmail, etc.) are welcome!

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mistOfTime/cats.git
cd cats
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root with the following keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

Fill in your own values from your Firebase project settings and Google AI Studio.

### 3. Run locally

```bash
npm run dev
```

## Deployment

Deploy on [Vercel](https://vercel.com). Add the environment variables above in your Vercel project settings before deploying.

After deploying, add your Vercel domain to Firebase Console → Authentication → Authorized domains.

## Tech Stack

- [Next.js 15](https://nextjs.org)
- [Firebase](https://firebase.google.com) (Auth + Firestore)
- [Genkit + Gemini](https://firebase.google.com/docs/genkit) (AI features)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---

*Supporting Student Mental Well-being • 2026*
