# Animivo mobile release

Animivo’s native apps are a Capacitor shell around the existing Next.js deployment. They do **not** static-export the App Router. Privileged work (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, AI, account deletion) stays on Vercel.

- **App name:** Animivo
- **Application / bundle ID:** `ai.animivo.app`
- **Custom scheme:** `animivo://`
- **Current hosted production URL:** `https://animivo.vercel.app`
- **Capacitor:** 8.x (`@capacitor/core` / `cli` / `android` / `ios`)
- **Android target SDK:** 36 (required by Capacitor 8 for current Play submissions)
- **iOS display name:** Animivo

Set `CAPACITOR_SERVER_URL` only when pointing a **local native build** at a specific deployed origin. Production store builds must use `https://animivo.vercel.app` (the default). Do not bake `localhost` into store binaries. A future custom domain can be introduced later through a separate migration. We do not own or configure `animivo.app`.

## Blank native WebView (Vercel domain redirect)

If the Android/iOS shell opens and immediately goes blank, or Chrome/WebView shows the unowned `animivo.app` hostname, the native URL is not the bug. Vercel is 307-redirecting `https://animivo.vercel.app` to that hostname. `animivo.app` is not ours (Railway 404, broken TLS), so the WebView dies.

Fix this in the Vercel dashboard — code cannot disable a platform alias redirect:

1. Vercel → Project **animivo** → **Settings → Domains**.
2. Remove `animivo.app` and `www.animivo.app` if they are listed.
3. Keep **`animivo.vercel.app` as the production domain**. Do not enable “redirect `.vercel.app` to custom domain”.
4. Set `NEXT_PUBLIC_APP_URL=https://animivo.vercel.app` (never the unowned apex host).
5. Redeploy Production.
6. Confirm in a terminal:

```bash
curl -sI https://animivo.vercel.app/
```

The response must be **200/302/307 on the same host** (or a path on `animivo.vercel.app`). It must **not** send `Location: https://` + the unowned apex hostname.

7. Rebuild the native app (`npx cap sync` then run/archive). An old binary will keep following the 307 until Vercel stops issuing it.

## Required environment variables

### Vercel (web + the origin the native WebView loads)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon/publishable key only |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://animivo.vercel.app` in production |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server only.** Never add to a mobile env file. |
| `OPENAI_API_KEY` | No | **Server only.** |
| `ADMIN_EMAILS` | No | Server only |
| `AI_DAILY_MESSAGE_LIMIT` | No | Server only |
| `NEXT_PUBLIC_IOS_TEAM_ID` | For Universal Links | Apple Team ID, no prefix |
| `NEXT_PUBLIC_ANDROID_SHA256_CERTS` | For App Links | Play App Signing cert SHA-256, colon-separated hex |

### Native build machines

| Variable | Required | Notes |
|---|---|---|
| `CAPACITOR_SERVER_URL` | No | Defaults to `https://animivo.vercel.app` |
| Android keystore passwords | Yes for release | Keep in a secrets manager, never git |
| Apple signing identities | Yes for release | Xcode / CI secrets only |

## Supabase Dashboard (manual)

Authentication → URL configuration (required):

```text
Site URL:
https://animivo.vercel.app

Redirect allow list:
https://animivo.vercel.app/auth/callback
https://animivo.vercel.app/reset-password
animivo://auth/callback
animivo://reset-password
```

Also allow local development: `http://localhost:3000/auth/callback`. Optional extras that already work in the app: `https://animivo.vercel.app/auth/callback?next=/reset-password` and `animivo://auth/callback?next=/reset-password`.

Enable Email (password) and, if used, Google. Google OAuth in the native app uses the system browser plus `animivo://auth/callback` so the PKCE verifier stays in the WebView. A future custom domain can replace these HTTPS origins later through a separate migration.

## Deep links / Universal Links / App Links

| Link | Purpose |
|---|---|
| `animivo://auth/callback` | Native OAuth / email-code return |
| `animivo://reset-password` | Native password-reset return |
| `https://animivo.vercel.app/auth/callback` | Web + Universal/App Link return |
| `animivo://invite/{token}` | Caregiver invite |
| `https://animivo.vercel.app/invite/{token}` | Invite opened from email |

Well-known files are served by Next.js:

- `https://animivo.vercel.app/.well-known/apple-app-site-association`
- `https://animivo.vercel.app/.well-known/assetlinks.json`

Replace `TEAMID` and `REPLACE_WITH_PLAY_APP_SIGNING_CERT_SHA256` via the public env vars above, then redeploy Vercel.

### Apple Universal Links

1. Apple Developer → Identifiers → `ai.animivo.app` → enable Associated Domains.
2. Xcode Signing & Capabilities → Associated Domains → `applinks:animivo.vercel.app`.
3. Confirm AASA is reachable **without redirects** at `https://animivo.vercel.app/.well-known/apple-app-site-association`.

### Android App Links

1. Play Console → App integrity → App signing → copy SHA-256.
2. Set `NEXT_PUBLIC_ANDROID_SHA256_CERTS` and redeploy.
3. Confirm `https://animivo.vercel.app/.well-known/assetlinks.json`.
4. The AndroidManifest intent-filter uses `android:autoVerify="true"` for `https://animivo.vercel.app`.

## Permissions

### iOS (`Info.plist`)

- `NSCameraUsageDescription` — pet profile and health-record photos
- `NSPhotoLibraryUsageDescription` — choose an existing photo
- `NSPhotoLibraryAddUsageDescription` is **not** requested (we do not save back to the library)

### Android

- `CAMERA` — take pet/health photos
- `android.permission.INTERNET`
- Photo-picker usage goes through the Android photo picker / Capacitor Camera plugin. Do not add location, microphone, contacts, or SMS.

Request camera/library access only when the user taps **Add photo**.

## Icons and splash

Sources (existing Animivo paw mark, not a new logo):

- `resources/icon.png` — 1024×1024 (generated from `scripts/generate-icons.mjs`)
- `resources/splash.png` — 2732×2732

Regenerate:

```bash
npm run icons
npx capacitor-assets generate --ios --android \
  --iconBackgroundColor '#6b8f71' \
  --iconBackgroundColorDark '#6b8f71' \
  --splashBackgroundColor '#faf7f2' \
  --splashBackgroundColorDark '#faf7f2'
```

If Apple rejects the generated 1024 mark, replace `resources/icon.png` with a designer-exported **1024×1024 PNG** of the current Animivo paw (no transparency for App Store) and re-run `capacitor-assets`. Do not invent a second logo.

## Versioning

Keep these three in lockstep:

| Surface | Field | Example |
|---|---|---|
| npm | `package.json` `version` | `0.1.0` |
| Android | `versionName` / `versionCode` | `0.1.0` / `1` |
| iOS | `CFBundleShortVersionString` / `CFBundleVersion` | `0.1.0` / `1` |

Bump `versionCode` / `CFBundleVersion` on **every** store upload, even for a hotfix of the same marketing version.

## Android build

Prerequisites: JDK 21, Android Studio with SDK 36, this repo.

1. `npm install`
2. `npx cap sync android`
3. Create an upload keystore **once** (not in git):

```bash
keytool -genkeypair -v -keystore "$HOME/secrets/animivo-upload.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias animivo-upload
```

4. Create `android/keystore.properties` (gitignored pattern — keep it out of the repo):

```
storeFile=/absolute/path/to/animivo-upload.jks
storePassword=***
keyAlias=animivo-upload
keyPassword=***
```

5. Produce the Play App Bundle:

```bash
npm run android:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

6. Upload the `.aab` to Play Console (internal testing first). Enroll Play App Signing.

Open the project with `npm run cap:open:android`.

## iOS build

Prerequisites: macOS, latest stable Xcode, Apple Developer membership.

1. `npm install`
2. `npx cap sync ios`
3. `npm run cap:open:ios`
4. Signing: Team + `ai.animivo.app`. Do not commit certificates or `.p12` files.
5. Product → Archive.
6. Distribute App → App Store Connect → Upload.
7. TestFlight: add internal testers, then external review if needed.

`pod install` runs during `cap sync` on macOS.

## TestFlight process

1. Archive and upload as above.
2. Wait for processing in App Store Connect.
3. TestFlight → Internal group for engineering.
4. External testers require a short “What to test” note (see `docs/APP_STORE_CHECKLIST.md`).
5. Install on a physical iPhone; confirm email login, Google (if enabled), care tasks, AI, and offline banner.

## Google Play testing process

1. Create the app `Animivo` with package `ai.animivo.app`.
2. Upload `.aab` to Internal testing.
3. Add license testers.
4. Promote to Closed testing, then Production after store listing and questionnaire are complete.

## Production release process

1. Deploy Vercel **first** so the native WebView origin is current.
2. Confirm Supabase redirect URLs and well-known files.
3. Bump native version codes.
4. `npx cap sync`
5. Build `.aab` and iOS archive.
6. Submit both stores with the checklists in `docs/APP_STORE_CHECKLIST.md`.
7. Do not ship a binary that still points `CAPACITOR_SERVER_URL` at a preview hostname.

## Billing (not live in this release)

Free / Animivo Plus entitlements already exist (`src/lib/entitlements/plans.ts`, `profiles.subscription_plan`).

| Platform | Future provider | This release |
|---|---|---|
| Web | Server-side web billing adapter | CTA disabled |
| iOS | Apple In-App Purchase | CTA disabled — no web checkout |
| Android | Google Play Billing | CTA disabled — no web checkout |

Successful future purchases must write the same entitlement fields. Do not mark a purchase complete in the client alone.

## Security

- Native bundles load `https://animivo.vercel.app`. They never receive `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- Session cookies remain first-party on `animivo.vercel.app` for email/password. OAuth PKCE verifier stays in WebView storage.
- RLS is unchanged.
- Account deletion uses the existing `POST /api/account/delete` route (service role on the server only).

## Known limitations

- Store IAP adapters are not implemented.
- Universal Links / App Links will not verify until Team ID and Play SHA-256 are filled in and the Apple/Google consoles are configured.
- `npx cap open ios` and App Store archives require macOS.
- Google may still block some WebView OAuth clients; the app uses the system browser + `animivo://` callback for native Google sign-in.
- Offline mode is read-only messaging. Writes and AI calls are not faked.
- iOS/Android simulators were not available in the Linux CI agent that prepared this work.
