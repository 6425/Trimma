export default function Card({ title, value }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}
