import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { SkipLink } from "@/components/layout/skip-link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface MarketingShellProps {
  children: React.ReactNode;
  variant?: "default" | "onboarding";
}

const onboardingFooterLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/ai-disclaimer", label: "AI disclaimer" },
] as const;

export function MarketingShell({ children, variant = "default" }: MarketingShellProps) {
  const isOnboarding = variant === "onboarding";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <header
        className={cn(
          "mx-auto flex w-full max-w-[1240px] shrink-0 items-center justify-between gap-4 px-5 md:px-8",
          isOnboarding
            ? "sticky top-0 z-40 border-b border-border/60 bg-background/95 py-3 backdrop-blur-sm"
            : "h-[88px] md:h-[96px]",
        )}
      >
        <Logo size={isOnboarding ? "sm" : "md"} priority />
        <Link
          href="/login"
          className="inline-flex min-h-11 shrink-0 items-center text-[0.92rem] font-semibold text-primary underline decoration-primary/40 underline-offset-[5px] transition-colors hover:decoration-primary"
        >
          Sign In
        </Link>
      </header>
      <main id="main-content" className={cn("flex min-h-0 flex-1 flex-col")}>
        {children}
      </main>
      <footer
        className={cn(
          "mt-auto shrink-0 border-t border-border px-5 md:px-8",
          isOnboarding ? "py-4 text-center text-xs text-muted-foreground" : "py-9",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-[1120px] text-sm text-muted-foreground",
            isOnboarding ? "space-y-2" : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          {!isOnboarding ? <Logo size="sm" /> : null}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            {onboardingFooterLinks.map((link) => (
              <Link key={link.href} href={link.href} className="min-h-11 inline-flex items-center transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className={cn(isOnboarding && "mx-auto leading-relaxed")}>
            © {new Date().getFullYear()} {brand.name}. Made with care for pets and their people.
          </p>
        </div>
      </footer>
    </div>
  );
}
