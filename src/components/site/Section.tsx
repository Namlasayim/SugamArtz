import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  bleed,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section className={cn("mx-auto w-full px-5 lg:px-10", bleed ? "max-w-none" : "max-w-7xl", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}