import Link from "next/link";
import { Calculator, FileText, GitCompare, PieChart } from "lucide-react";

const quickActions = [
  { href: "/portfolio", label: "المحفظة", hint: "توزيع، دخل، DRIP وضغط", icon: PieChart },
  { href: "/calculator", label: "الحاسبة", hint: "هدف العائد وعدد الأسهم", icon: Calculator },
  { href: "/compare", label: "المقارنة", hint: "قواعد تمييز تلقائية", icon: GitCompare },
  { href: "/report", label: "التقرير", hint: "تنسيق جاهز للطباعة", icon: FileText },
];

export function DashboardQuickActions() {
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href} className="fusion-panel group rounded-2xl p-4 hover:border-orange-400">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/12 text-orange-500 group-hover:bg-orange-500 group-hover:text-white">
            <action.icon size={21} aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-black text-[color:var(--foreground)]">{action.label}</h2>
          <p className="mt-1 text-sm font-semibold text-[color:var(--muted)]">{action.hint}</p>
        </Link>
      ))}
    </section>
  );
}
