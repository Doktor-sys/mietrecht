# Store Submission Guide 🚀

This guide directs you through the final steps of building and submitting your app to the Google Play Store and Apple App Store using EAS (Expo Application Services).

## 1. Prerequisites (Checklist)

- [ ] **EAS Account**: You must be logged in. Run `eas login`.
- [ ] **EAS Project**: Your `app.json` must be linked. Run `eas init` if you haven't yet.
- [ ] **Credentials**:
    - **Android**: You need a Google Play Developer account.
    - **iOS**: You need an Apple Developer Program membership ($99/year).

## 2. Configuration Check

### `app.json`
Ensure your version is correct before building:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1,
      "package": "com.smartlaw.mietrecht"
    },
    "ios": {
      "buildNumber": "1.0.0",
      "bundleIdentifier": "com.smartlaw.mietrecht"
    }
  }
}
```

### `eas.json`
Your production profile is ready. It produces:
- **Android**: `.aab` (Android App Bundle) - Required for Play Store.
- **iOS**: `.ipa` - Required for App Store.

## 3. Generate Production Builds

Run these commands in your terminal:

### Android (Google Play)
```bash
eas build --platform android --profile production
```
*This will create an AAB file on EAS servers.*

### iOS (App Store)
```bash
eas build --platform ios --profile production
```
*This will create an IPA file on EAS servers.*

---

## 4. Submission (Upload to Stores)

Once the builds are finished, you can submit them directly.

### Option A: Automatic Submission (Recommended)
This requires configuring `eas.json` with your credentials keys (see `submit` section in `eas.json`).

**Android:**
```bash
eas submit --platform android --profile production
```

**iOS:**
```bash
eas submit --platform ios --profile production
```

### Option B: Manual Upload
1. Go to your [Expo Dashboard](https://expo.dev).
2. Download the `.aab` (Android) or `.ipa` (iOS) file.
3. Upload manually via:
   - **Google Play Console**: Production -> Create new release.
   - **Transporter App (macOS)**: For uploading the `.ipa` to App Store Connect.

## 5. Post-Submission
- **Testing**: Use TestFlight (iOS) or Internal Testing track (Android) to verify the build.
- **Release**: Promote the build to Production review once tested.
