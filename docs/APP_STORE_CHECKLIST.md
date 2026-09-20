# App Store checklist

Use with `docs/MOBILE_RELEASE.md`. Tick items only after they are actually done.

## Shared (do before either store)

- [ ] Production Vercel deploy of this branch is live at `https://animivo.vercel.app`
- [ ] Vercel **Settings → Domains** does **not** list `animivo.app` (that 307 blanks the native WebView)
- [ ] `curl -sI https://animivo.vercel.app/` does not redirect to the unowned apex hostname
- [ ] `NEXT_PUBLIC_APP_URL=https://animivo.vercel.app`
- [ ] `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` exist only on Vercel (not in the git repo, not in the Android/iOS project)
- [ ] Supabase redirect URLs include `https://animivo.vercel.app/auth/callback`, `https://animivo.vercel.app/reset-password`, `animivo://auth/callback`, and `animivo://reset-password`
- [ ] Privacy Policy, Terms, and AI Disclaimer open from Settings → About
- [ ] Account deletion completes from Settings (Danger zone)
- [ ] Native purchase buttons remain disabled until IAP/Play Billing ships
- [ ] Reviewer demo account created (email/password) with at least one cat, dog, or bird
- [ ] Reviewer notes explain that AI does not diagnose and that nutrition is deterministic

A future custom domain can replace `animivo.vercel.app` later through a separate migration. Do not configure ownership of `animivo.app`.

## Apple App Store

- [ ] Bundle ID `ai.animivo.app` registered
- [ ] App name **Animivo**
- [ ] Associated Domains `applinks:animivo.vercel.app`
- [ ] `NEXT_PUBLIC_IOS_TEAM_ID` set; AASA file returns JSON at `https://animivo.vercel.app/.well-known/apple-app-site-association`
- [ ] Camera and photo library usage strings present
- [ ] 1024×1024 App Store icon from `resources/icon.png` (replace with a designer PNG if review rejects the generated paw)
- [ ] Screenshots for 6.7" and 6.1" (and SE-sized if required by the current App Store Connect form)
- [ ] Privacy Nutrition Label: account, pet health data, photos, crash/diagnostics as applicable
- [ ] Sign in with Apple is **not** required while Google is optional and email/password is always available
- [ ] No third-party digital checkout inside the iOS app
- [ ] Export compliance / encryption questionnaire completed
- [ ] Age rating completed (pets/health content; no social UGC beyond caregiver invites)
- [ ] TestFlight internal build installed on a physical iPhone
- [ ] Archive uploaded; version `CFBundleShortVersionString` + unique `CFBundleVersion`
- [ ] Review notes include demo login, that the app loads `https://animivo.vercel.app`, and how to find legal pages

### Apple review notes (paste)

```
Demo: <email> / <password>
The iOS app is a Capacitor shell that loads the production Animivo site at https://animivo.vercel.app.
Privileged AI and database admin operations run on the Vercel backend, not on-device.
Settings → About contains Privacy Policy, Terms, and AI Disclaimer.
Settings → Danger zone deletes the account.
In-app purchase is not enabled in this build; Plus upgrade is listed as coming soon.
```

## Google Play

- [ ] Application ID `ai.animivo.app`
- [ ] App name **Animivo**
- [ ] Target SDK 36 (Capacitor 8 default)
- [ ] Upload keystore stored offline; Play App Signing enabled
- [ ] `.aab` uploaded (`npm run android:bundle`)
- [ ] `versionName` / unique `versionCode`
- [ ] Play App Signing SHA-256 in `NEXT_PUBLIC_ANDROID_SHA256_CERTS`; `assetlinks.json` live at `https://animivo.vercel.app/.well-known/assetlinks.json`
- [ ] Camera permission declared and used only for pet/health photos
- [ ] Data safety form: account data, health records, photos, optional analytics
- [ ] Store listing, high-res icon (512), feature graphic
- [ ] Phone screenshots (include a small-phone crop if the form asks)
- [ ] Content rating questionnaire
- [ ] No web digital checkout inside the Play build
- [ ] Internal testing track passed on a physical Android phone
- [ ] Production release from the Play Console after closed testing

### Play review notes (paste)

```
Demo: <email> / <password>
The Android app loads https://animivo.vercel.app in a Capacitor WebView.
Back: nested screens go back; open sheets/dialogs close; Home does not return to login/onboarding.
Settings → About: Privacy, Terms, AI Disclaimer. Account deletion is in Settings.
Billing is not charged in this version.
```
