export default function FolderGrid() {
  const folders = ["Project", "Study", "Career", "Design"];

  return (
    <section className="mb-6">
      <h2 className="mb-4 text-xl font-semibold">Folders</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {folders.map((folder) => (
          <div
            key={folder}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-3 text-3xl">📁</div>
            <h3 className="font-semibold">{folder}</h3>
            <p className="text-sm text-slate-500">Open folder</p>
          </div>
        ))}
      </div>
    </section>
  );
}