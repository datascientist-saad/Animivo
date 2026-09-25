import { resolvePostAuthPath, sanitizeNextPath } from "@/lib/auth-redirect";
import {
  buildNativeOAuthHandoffUrl,
  nativeOAuthHandoffHtml,
  shouldHandoffOAuthToNativeApp,
} from "@/lib/native/oauth-handoff";
import { createClient } from "@/lib/supabase/server";
import { PetService } from "@/services/pet-service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = sanitizeNextPath(searchParams.get("next"));

  if (shouldHandoffOAuthToNativeApp(searchParams)) {
    const location = buildNativeOAuthHandoffUrl(searchParams);
    return new Response(nativeOAuthHandoffHtml(location), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        Location: location,
      },
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let hasNoPets = false;
      let hasIncompleteOnboarding = false;

      if (user) {
        try {
          const pets = await new PetService(supabase).listForUser(user.id);
          hasNoPets = pets.length === 0;
          hasIncompleteOnboarding = pets.some((pet) => !pet.onboarding_completed);
        } catch {
          // keep requested destination
        }
      }

      const destination = resolvePostAuthPath(nextParam, {
        hasNoPets,
        hasIncompleteOnboarding,
        hasPendingOnboardingDraft: request.headers.get("cookie")?.includes("animivo_onboarding_pending=1"),
      });

      return Response.redirect(`${origin}${destination}`, 307);
    }
  }

  return Response.redirect(`${origin}/login?error=auth_callback_failed`, 307);
}
