import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[16rem_1fr]">
        <Sidebar />
        <main className="rounded-2xl border bg-card p-4 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
