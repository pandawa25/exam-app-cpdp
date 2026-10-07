import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLES, disciplineLabel, positionLabel, roleLabel } from "@/lib/constants";
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

  const inputClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">User</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/import"
            className="text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/users/new"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            + Tambah User
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama, email, atau departemen"
          className={`${inputClass} w-72`}
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
        <button type="submit" className="text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50">
          Filter
        </button>
      </form>

      <p className="text-xs text-slate-400 mb-3">
        {total} user{total > PAGE_SIZE ? ` (menampilkan ${PAGE_SIZE} pertama, persempit dengan filter)` : ""}
      </p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
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
                <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                  Tidak ada user yang cocok.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="py-3 px-4">{roleLabel(u.role)}</td>
                <td className="py-3 px-4 text-slate-600">
                  {u.discipline && u.position
                    ? `${disciplineLabel(u.discipline)} / ${positionLabel(u.position)}`
                    : "-"}
                </td>
                <td className="py-3 px-4 text-slate-600">{u.department ?? "-"}</td>
                <td className="py-3 px-4">
                  {u.isActive ? (
                    <span className="text-green-700">Aktif</span>
                  ) : (
                    <span className="text-red-700">Nonaktif</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/admin/users/${u.id}`} className="text-brand-700 hover:underline">
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
