import { ResultsView } from "@/components/ResultsView";
import { finalizeExpiredAttempts } from "@/lib/scoring";
import { loadResults, parseFilters } from "@/lib/results";

export const dynamic = "force-dynamic";

// Akses dibatasi ADMIN oleh middleware (/admin/*).
export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Tutup attempt yang waktunya sudah habis tapi tak pernah di-finalize (peserta menghilang),
  // supaya muncul sebagai selesai dengan skornya, bukan menggantung "sedang berjalan".
  await finalizeExpiredAttempts();

  const filters = parseFilters(searchParams);
  const data = await loadResults(filters);

  return <ResultsView basePath="/admin/results" filters={filters} {...data} />;
}
