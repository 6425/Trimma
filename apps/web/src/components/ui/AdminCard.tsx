export default function Card({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center">
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</h3>
    </div>
  );
}
