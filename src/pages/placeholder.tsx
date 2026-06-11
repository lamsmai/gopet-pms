import { Construction } from "lucide-react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Construction className="h-7 w-7" />
      </span>
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        This module is part of GoPet PMS v2.0 and will be designed next.
      </p>
    </div>
  );
}
