import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";


export default function AppLayout() {

  return (

    <div
      className="min-h-screen bg-zinc-900"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >

      {/* ======================================
          SIDEBAR
      ====================================== */}
      <Sidebar />


      {/* ======================================
          MAIN AREA
      ====================================== */}
      <div className="lg:pl-64">

        {/* HEADER */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="pt-16 min-h-screen">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

      </div>

    </div>

  );
}