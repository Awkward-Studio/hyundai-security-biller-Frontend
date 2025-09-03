import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function SidebarLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex">
        <Sidebar home="/admin" />
        {/* Include shared UI here e.g. a header or sidebar */}
        <nav></nav>
        <div className="flex justify-center w-full">{children}</div>
      </div>
      <Toaster className="bg-red-400" />
    </section>
  );
}
