import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export function Logo({ className, iconClassName }: LogoProps) {
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-primary", className)}>
      <BriefcaseBusiness className={cn("h-4 w-4 text-primary-foreground", iconClassName)} />
    </div>
  );
}
