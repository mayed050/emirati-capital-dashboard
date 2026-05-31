import { clsx } from "clsx";

export function MiniCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-lg border border-white/10 bg-white/5 p-3 text-right transition-all hover:bg-white/10 hover:border-slate-300/30", className)}>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="number mt-1 font-black text-slate-950 text-lg leading-none">{value}</p>
    </div>
  );
}
