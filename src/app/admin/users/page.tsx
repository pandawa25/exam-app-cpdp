import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLES, jobTitle, roleLabel } from "@/lib/constants";
import { matchOption } from "@/lib/users";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; status?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const role = matchOption(searchParams.role, ROLES);
  const onlyInactive = searchParams.status === "inactive";

  const where: Prisma.UserWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { department: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      role ? { role: role as any } : {},
      onlyInactive ? { isActive: false } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const inputClass = "input w-auto";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">User</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/import"
            className="btn btn-secondary"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/users/new"
            className="btn btn-primary"
          >
            Tambah user
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama, email, atau departemen"
          className="input w-72 max-w-full"
        />
        <select name="role" defaultValue={role ?? ""} className={inputClass}>
          <option value="">Semua role</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={onlyInactive ? "inactive" : ""} className={inputClass}>
          <option value="">Semua status</option>
          <option value="inactive">Nonaktif saja</option>
        </select>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      <p className="text-xs text-ink-mute mb-3">
        {total} user{total > PAGE_SIZE ? ` (menampilkan ${PAGE_SIZE} pertama, persempit dengan filter)` : ""}
      </p>

      <div className="bg-panel-raised rounded-card border border-panel-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-mute border-b border-panel-line">
              <th className="py-3 px-4 font-medium">Nama</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Disiplin / Jabatan</th>
              <th className="py-3 px-4 font-medium">Departemen</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-ink-mute">
                  Tidak ada user yang cocok.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-panel-line last:border-0">
                <td className="py-3 px-4">
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-ink-mute">{u.email}</p>
                </td>
                <td className="py-3 px-4">{roleLabel(u.role)}</td>
                <td className="py-3 px-4 text-ink-soft">
                  {u.discipline && u.position ? jobTitle(u.discipline, u.position) : "-"}
                </td>
                <td className="py-3 px-4 text-ink-soft">{u.department ?? "-"}</td>
                <td className="py-3 px-4">
                  {u.isActive ? (
                    <span className="badge badge-ok">Aktif</span>
                  ) : (
                    <span className="badge badge-alarm">Nonaktif</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/admin/users/${u.id}`} className="text-brand hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
