// Tampil sesaat saat halaman server berpindah atau data masih dimuat.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl px-4 py-10">
      <span className="sr-only">Memuat...</span>
      <div className="h-7 w-48 animate-pulse rounded bg-panel-high" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-panel-raised" />
      <div className="mt-8 space-y-3">
        <div className="h-20 animate-pulse rounded-card border border-panel-line bg-panel-raised" />
        <div className="h-20 animate-pulse rounded-card border border-panel-line bg-panel-raised" />
        <div className="h-20 animate-pulse rounded-card border border-panel-line bg-panel-raised" />
      </div>
    </div>
  );
}
