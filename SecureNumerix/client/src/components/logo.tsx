import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("font-bold text-xl flex items-center", className)}>
      <ShieldCheck className="h-6 w-6 text-primary" />
      <span className="font-semibold text-xl">SecureNum</span>
    </div>
  );
}