import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { ResultsView } from "@/components/ResultsView";
import { SupervisorTabs } from "@/components/SupervisorTabs";
import { finalizeExpiredAttempts } from "@/lib/scoring";
import { loadResults, parseFilters } from "@/lib/results";

export const dynamic = "force-dynamic";

export default async function SupervisorResultsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERVISOR") redirect("/login");

  await finalizeExpiredAttempts();

  const filters = parseFilters(searchParams);
  const data = await loadResults(filters);

  return (
    <>
      <AppHeader width="max-w-6xl" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SupervisorTabs current="results" />
        <ResultsView basePath="/supervisor/results" filters={filters} {...data} />
      </main>
    </>
  );
}
