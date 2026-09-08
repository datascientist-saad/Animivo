import { BackLink } from "@/components/shared/back-link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
  backHref?: string;
  onBack?: () => void;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
  backHref,
  onBack,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 space-y-3", className)}>
      {backHref || onBack ? (
        <BackLink fallbackHref={backHref ?? "/home"} onClick={onBack} />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 animate-fade-up">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 animate-fade-up">{action}</div> : null}
      </div>
    </div>
  );
}
