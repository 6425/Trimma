export default function Card({ title, value }: any) {
  return (
    <div className="bg-primary text-zinc-900 p-4 rounded-xl border border-primary/20 shadow-sm hover-glow transition-all">
      <p className="text-zinc-800 font-medium text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}
