import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "h-12 w-auto",
  md: "h-16 w-auto md:h-[4.5rem]",
  lg: "h-[5.5rem] w-auto sm:h-24",
} as const;

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: keyof typeof sizeClass;
  priority?: boolean;
}

export function Logo({ className, showTagline = false, size, priority = false }: LogoProps) {
  const resolved = size ?? (showTagline ? "lg" : "md");

  return (
    <Link
      href="/"
      aria-label={brand.aiName}
      className={cn("inline-flex items-center transition-opacity hover:opacity-80", className)}
    >
      <Image
        src={brand.logoSrc}
        alt={brand.aiName}
        width={119}
        height={72}
        className={cn("w-auto object-contain object-left", sizeClass[resolved])}
        priority={priority}
      />
    </Link>
  );
}
