import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex flex-1 flex-col">
        <Header
          setSidebarOpen={setSidebarOpen}
          isCollapsed={sidebarCollapsed}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}>
          <div className="container mx-auto p-6 space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}