
# CIT-U SafeSpace

A secure student well-being community for CIT University. Personal emails (Gmail, etc.) are welcome!

## 🚀 Final Deployment Checklist

If you are seeing errors during login or sign-up, follow these steps exactly:

### 1. Enable Identity Toolkit API (CRITICAL)
1. Go to the **[Google Cloud Library](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=cit-u-safespace)**.
2. Ensure the project selected is **cit-u-safespace**.
3. Click **ENABLE**. If it's already enabled, wait 2 minutes for propagation.

### 2. Enable Authentication Providers (REQUIRED)
Even if the API is enabled, Firebase Auth won't work unless the provider is turned on:
1. Go to your **[Firebase Console Authentication Providers](https://console.firebase.google.com/project/cit-u-safespace/authentication/providers)**.
2. Click **Add new provider**.
3. Select **Email/Password** and set it to **Enabled**.
4. Select **Google** and set it to **Enabled** (this is what allows "Gmail" sign-in).

### 3. Update Vercel Environment Variables
Ensure these variables are set in **Vercel -> Settings -> Environment Variables**. After updating, you **MUST REDEPLOY**.

| Variable Name | Value |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `` |
| `GEMINI_API_KEY` | `` |

### 4. Add Authorized Domains
1. Go to your **[Firebase Console Authentication Settings](https://console.firebase.google.com/project/cit-u-safespace/authentication/settings)**.
2. Under **Authorized domains**, ensure these are added:
   - `wild-alpha.vercel.app`
   - `studio-seven-livid-75.vercel.app`

---
*Supporting CIT-U Student Mental Well-being • 2026*
