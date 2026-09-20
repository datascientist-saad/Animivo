import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";
import { NATIVE_APP_ID, NATIVE_APP_NAME, NATIVE_PRODUCTION_ORIGIN } from "./src/lib/native/constants";

const serverUrl = (process.env.CAPACITOR_SERVER_URL || NATIVE_PRODUCTION_ORIGIN).replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: NATIVE_APP_ID,
  appName: NATIVE_APP_NAME,
  webDir: "native-www",
  backgroundColor: "#faf7f2",
  loggingBehavior: "debug",
  server: {
    // Must stay on the Vercel alias. Do not add the unowned animivo.app host:
    // Vercel will 307 there and the WebView goes blank (SSL/404).
    url: "https://animivo.vercel.app",
    cleartext: false,
    errorPath: "offline.html",
    allowNavigation: [
      "animivo.vercel.app",
      "*.supabase.co",
      "accounts.google.com",
      "*.google.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2500,
      backgroundColor: "#faf7f2",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#faf7f2",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    SystemBars: {
      insetsHandling: "css",
      style: "DARK",
    },
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    scheme: "App",
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
