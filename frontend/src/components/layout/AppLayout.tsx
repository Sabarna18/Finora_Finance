import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  function handleOpenSidebar() {
    setMobileSidebarOpen(true);
  }

  function handleCloseSidebar() {
    setMobileSidebarOpen(false);
  }

  return (
    <div
      className="
        min-h-screen
        bg-zinc-900
        text-white
      "
      style={{
        fontFamily:
          "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* ==================================================
          MAIN AREA
      ================================================== */}

      <div
        className="
          min-h-screen
          lg:pl-64
        "
      >
        {/* ==================================================
            HEADER
            Header is fixed and owns the single mobile
            hamburger button (via onMenuClick). No duplicate
            button lives here anymore.
        ================================================== */}

        <Header onMenuClick={handleOpenSidebar} />

        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <main
          className="
            min-h-screen
            pt-16
          "
        >
          <div
            className="
              w-full

              px-3
              py-4

              sm:px-4
              sm:py-5

              md:px-5

              lg:p-6
            "
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}