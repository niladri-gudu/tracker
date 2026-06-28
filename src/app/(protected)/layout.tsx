import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NavShell from "@/components/nav-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Cast session.user to make sure TS knows it has the expected fields
  const safeSession = {
    user: {
      name: session.user.name || "",
      email: session.user.email || "",
    },
  };

  return <NavShell session={safeSession}>{children}</NavShell>;
}
