# Testing Guide 🧪

Before uploading to the App Store or Google Play, you should verify your application. Here are the three best ways to do this.

## 1. Local Testing (Expo Go) - *Fastest*
The easiest way to test during development.

1.  Start the development server:
    ```bash
    cd mobile-app
    npm start
    ```
2.  **Physical Device**: Download the "Expo Go" app from the App Store/Play Store. Scan the QR code shown in the terminal.
3.  **Simulator**: Press `i` for iOS Simulator or `a` for Android Emulator (requires Android Studio/Xcode installed).

> **Note**: This works best when your phone and computer are on the same Wi-Fi.

## 2. Preview Build (APK / Simulator Build) - *Realistic*
Test the actual binary that will be installed, without resigning to the store.

### Android (APK)
Generate an installable APK file for your Android device:
```bash
eas build -p android --profile preview
```
-   Wait for the build to finish.
-   Download the `.apk`.
-   Transfer to your phone and install.

### iOS (Simulator)
Generate a build for the iOS Simulator (since installing on a real iPhone requires a paid developer account for Ad-Hoc distribution):
```bash
eas build -p ios --profile preview
```
-   Download the build.
-   Drag and drop into the iOS Simulator.

## 3. Google Play Internal Testing - *Production-Ready*
This is the "Google Server" method for distributing to testers safely. It mimics the real store download.

1.  Build a **Production AAB**:
    ```bash
    eas build -p android --profile production
    ```
2.  Go to **Google Play Console** > **Testing** > **Internal testing**.
3.  Create a release and upload the `.aab` file.
4.  Add your own email as a tester.
5.  You will get a download link from the Play Store (safe, not public).

---

## 🛑 Backend Connection (Server)
Your app needs to talk to the backend (`api.ts`).

-   **Local Testing**: Ensure your `API_URL` in `src/config.ts` points to your computer's IP address (e.g., `http://192.168.1.50:3000`), NOT `localhost`.
-   **Cloud Testing ("Google Server")**: If you want to test independently of your computer, you must deploy the backend to a cloud provider like **Google Cloud Run**.
    1.  Push your Docker image to Google Container Registry.
    2.  Deploy to Cloud Run.
    3.  Update `API_URL` to the `https://...` address provided by Google.
