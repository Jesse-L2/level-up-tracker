# Deployment Guide: Level Up Tracker

This guide walks you through building and deploying your app to Google Play or sideloading it to your phone.

## Prerequisites

1.  **Android Studio**: [Download here](https://developer.android.com/studio).
2.  **JDK 17+**: Usually bundled with Android Studio.

---

## Quick Commands

| Action                 | Command                    |
| ---------------------- | -------------------------- |
| Build web app          | `npm run build`            |
| Sync to Android        | `npx cap sync`             |
| Open in Android Studio | `npx cap open android`     |

---

## Option 1: Sideload APK to Your Phone

1.  **Build & Sync**:
    ```bash
    npm run build
    npx cap sync
    npx cap open android
    ```

2.  **In Android Studio**:
    - Wait for Gradle sync to complete.
    - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    - The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

3.  **Install on Phone**:
    - Enable "Install from unknown sources" in your phone settings.
    - Transfer the APK to your phone and open it to install.

---

## Option 2: Deploy to Google Play

### A. Create a Signed Release Bundle

1.  In Android Studio, go to **Build > Generate Signed Bundle / APK**.
2.  Select **Android App Bundle** and click **Next**.
3.  Create a new keystore or use an existing one:
    - **Key store path**: Choose a secure location.
    - **Password**: Use a strong password (save it securely!).
    - **Key alias**: e.g., `levelup-key`.
4.  Select **release** as the build variant and click **Create**.

> [!CAUTION]
> **Back up your keystore file!** If you lose it, you cannot update your app on Google Play.

### B. Google Play Console

1.  Go to [Google Play Console](https://play.google.com/console).
2.  Create a new app and fill in the required details.
3.  Navigate to **Production > Create new release**.
4.  Upload your `.aab` file from `android/app/release/app-release.aab`.
5.  Complete the content rating, pricing, and distribution settings.
6.  Submit for review.

---

## Updating Your App

After making code changes:

```bash
npm run build
npx cap sync
```

Then rebuild in Android Studio and upload the new `.aab` to Google Play.
