import { brand } from "@/lib/brand";

export function AiTypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-live="polite">
      <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground">
        <span className="sr-only">{brand.aiName} is thinking</span>
        <span className="flex h-5 items-center gap-1.5" aria-hidden>
          <span className="ai-typing-dot" />
          <span className="ai-typing-dot" />
          <span className="ai-typing-dot" />
        </span>
      </div>
    </div>
  );
}
