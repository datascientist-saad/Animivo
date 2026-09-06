/**
 * Global branding configuration for Animivo.
 * Tokens match the waitlist site (https://animivo-waitlist.vercel.app/).
 * Change app name, tagline, and colors here — components consume these tokens.
 */
export const brand = {
  name: "Animivo",
  logoText: "Animivo",
  logoSrc: "/brand/animivo-logo.png",
  logoWidth: 1400,
  logoHeight: 849,
  tagline: "Every pet. One smarter care plan.",
  subtitle:
    "Personalized nutrition, health and preventive care for every kind of pet.",
  positioning:
    "Animivo creates an evolving nutrition, health and preventive-care plan for every pet.",
  supportEmail: "hello@animivo.app",
  aiName: "Animivo AI",
  colors: {
    primary: "#6B8F71",
    primaryHover: "#5D7E63",
    primaryForeground: "#FFFFFF",
    secondary: "#F3EDE4",
    secondaryForeground: "#3D3429",
    accent: "#E07A5F",
    accentForeground: "#FFFFFF",
    background: "#FAF7F2",
    foreground: "#2C2A26",
    muted: "#F0EBE3",
    mutedForeground: "#6B6560",
    card: "#FFFFFF",
    border: "#E8E0D5",
    ring: "#6B8F71",
    success: "#5A8F6B",
    warning: "#D4A373",
    danger: "#C45C4A",
    ink: "#3A4A3E",
    inkForeground: "#F7F3EE",
  },
} as const;

export type Brand = typeof brand;
