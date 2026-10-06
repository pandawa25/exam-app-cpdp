import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminNav />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
