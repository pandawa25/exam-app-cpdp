"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DISCIPLINES, POSITIONS, ROLES } from "@/lib/constants";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  discipline: string | null;
  position: string | null;
  department: string | null;
};

// Password acak di browser (hanya untuk pengisi field; hash tetap dibuat di server).
function randomPassword(length = 10) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const inputClass = "input";

// Dipakai untuk "Tambah User" (tanpa prop user) dan "Edit User" (dengan prop user).
export function UserForm({ user }: { user?: UserData }) {
  const router = useRouter();
  const isEdit = !!user;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "PESERTA");
  const [discipline, setDiscipline] = useState<string>(user?.discipline ?? DISCIPLINES[0].value);
  const [position, setPosition] = useState<string>(user?.position ?? POSITIONS[0].value);
  const [department, setDepartment] = useState(user?.department ?? "");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("PESERTA");
    setDepartment("");
    setPassword("");
    setCreated(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const payload: Record<string, unknown> = {
      name,
      email,
      role,
      department,
      discipline: role === "PESERTA" ? discipline : null,
      position: role === "PESERTA" ? position : null,
    };
    if (password) payload[isEdit ? "newPassword" : "password"] = password;

    const res = await fetch(isEdit ? `/api/users/${user!.id}` : "/api/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Gagal menyimpan user");
      return;
    }

    if (isEdit) {
      setNotice(password ? "Perubahan tersimpan dan password diganti." : "Perubahan tersimpan.");
      setPassword("");
      router.refresh();
      return;
    }

    if (json.temporaryPassword) {
      setCreated({ email: json.email, password: json.temporaryPassword });
      return;
    }
    router.push("/admin/users");
  }

  if (created) {
    return (
      <div className="bg-panel-raised rounded-card border border-panel-line p-6 space-y-4">
        <p className="text-sm font-medium text-ok">User berhasil dibuat.</p>
        <div className="rounded-ctl bg-warn-dim border border-warn/40 p-4 text-sm">
          <p className="text-warn mb-2">
            Password sementara ini hanya ditampilkan sekali. Salin dan berikan ke yang bersangkutan.
          </p>
          <p>
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <p>
            Password: <span className="font-mono">{created.password}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="btn btn-primary"
          >
            Tambah user lain
          </button>
          <Link href="/admin/users" className="text-sm text-ink-soft hover:underline self-center">
            Ke daftar user
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-panel-raised rounded-card border border-panel-line p-6">
      <div>
        <label className="label">Nama</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="label">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="label">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {role === "PESERTA" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Disiplin</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={inputClass}>
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jabatan</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className={inputClass}>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <p className="col-span-2 text-xs text-ink-mute">
            Disiplin &amp; jabatan menentukan exam mana yang muncul untuk peserta ini.
          </p>
        </div>
      )}

      <div>
        <label className="label">Departemen (opsional)</label>
        <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="label">
          {isEdit ? "Reset password (opsional)" : "Password (opsional)"}
        </label>
        <div className="flex gap-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            placeholder={isEdit ? "Kosongkan jika tidak diganti" : "Kosongkan untuk dibuatkan otomatis"}
            className={`${inputClass} font-mono`}
          />
          <button
            type="button"
            onClick={() => setPassword(randomPassword())}
            className="shrink-0 text-sm border border-panel-strong rounded-ctl px-3 hover:bg-panel-high"
          >
            Buat acak
          </button>
        </div>
        <p className="text-xs text-ink-mute mt-1">
          Minimal 8 karakter.
          {isEdit && " Salin password sebelum menyimpan; setelah disimpan tidak bisa dilihat lagi."}
        </p>
      </div>

      {error && <p className="text-sm text-alarm">{error}</p>}
      {notice && <p className="text-sm text-ok">{notice}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat User"}
      </button>
    </form>
  );
}
