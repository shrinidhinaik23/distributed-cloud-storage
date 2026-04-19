export default function StatsCards() {
  const stats = [
    { label: "Files", value: "128" },
    { label: "Folders", value: "21" },
    { label: "Shared", value: "14" },
    { label: "Storage", value: "11.8 GB" },
  ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-slate-200 bg-white p-5"
        >
          <h3 className="text-2xl font-semibold">{stat.value}</h3>
          <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}