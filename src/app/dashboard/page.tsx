import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full border border-border bg-card p-6 md:p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Welcome, {session.user.name || session.user.email}!
        </p>
        <p className="text-xs text-muted-foreground/60 mt-4 font-mono">
          [Protected Route]
        </p>
      </div>
    </div>
  );
}
