"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrandLogoFull } from "@/components/Brand";
import { PROGRAM_MODULE, PROGRAM_MODULE_SHORT, PROGRAM_NAME, PROGRAM_SHORT } from "@/lib/program";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah.");
        return;
      }

      // Redirect sesuai role ditangani di halaman /post-login (server component
      // yang baca session lalu redirect) supaya tidak perlu fetch role manual di sini.
      router.push("/post-login");
    } catch {
      setError("Server tidak merespons. Periksa koneksi, lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_30rem]">
      {/* Panel identitas: hanya di layar lebar. Grid tipis meniru kertas gambar P&ID. */}
      <section
        aria-hidden="true"
        className="relative hidden flex-col justify-center gap-12 overflow-hidden border-r border-panel-line bg-panel-raised p-12 lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(147,160,172,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(147,160,172,.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <BrandLogoFull width={130} />

        <div className="max-w-lg">
          <p className="mb-3 font-display text-xl font-medium uppercase tracking-wider text-brand">
            {PROGRAM_SHORT} &middot; {PROGRAM_MODULE} ({PROGRAM_MODULE_SHORT})
          </p>
          <h2 className="font-display text-5xl font-semibold leading-[1] text-ink">{PROGRAM_NAME}</h2>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandLogoFull width={120} />
            <p className="mt-3 font-display text-lg font-semibold leading-tight text-ink">{PROGRAM_NAME}</p>
          </div>

          <h1 className="page-title">Masuk</h1>
          <p className="mb-8 mt-1 text-sm text-ink-mute">Gunakan email dan password dari admin.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <p role="alert" className="notice notice-alarm">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-sm text-ink-mute">
            Lupa password? Minta admin mereset dari menu User.
          </p>
        </div>
      </section>
    </main>
  );
}
