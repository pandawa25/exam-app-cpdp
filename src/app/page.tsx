import { redirect } from "next/navigation";

// Root tidak punya UI sendiri: arahkan ke /post-login yang akan memutuskan
// ke /login (belum login) atau dashboard sesuai role (sudah login).
export default function RootPage() {
  redirect("/post-login");
}
