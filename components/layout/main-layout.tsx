"use client";

import { usePathname } from "next/navigation";
import Topbar from "components/layout/topbar";
import BottomNav from "components/layout/BottomNav";
import { ToastContainer } from "react-toastify";
import "../../node_modules/react-toastify/dist/ReactToastify.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showTopbar = pathname === "/";

  return (
    <div className="flex h-full flex-col">
      {showTopbar && <Topbar />}

      <main className="flex-1 overflow-auto bg-[#F3F7F6] p-6 pb-[140px]">
        {children}
        
      </main>
      <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      <BottomNav />
    </div>
  );
}
