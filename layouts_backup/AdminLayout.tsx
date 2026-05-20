import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import AdminHeader from "../components/header/AdminHeader";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <AdminHeader />

        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
