// Server Component
import SidebarNav from "@/components/SidebarNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh flex overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
