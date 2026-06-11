import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { LangProvider } from "@/lib/i18n";
import { LayoutProvider } from "@/lib/layout-mode";
import { AppShell } from "@/components/layout/app-shell";
import DashboardCS from "@/pages/dashboard-cs";
import ConsultationsList from "@/pages/consultations-list";
import ConsultationDetail from "@/pages/consultation-detail";
import SchedulePage from "@/pages/schedule";
import Placeholder from "@/pages/placeholder";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardCS /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "schedule/clinic-surgery", element: <Navigate to="/schedule" replace /> },
      { path: "patients", element: <Placeholder title="Patients" /> },
      { path: "consultations", element: <ConsultationsList /> },
      { path: "consultations/all", element: <ConsultationsList /> },
      { path: "consultations/in-progress", element: <ConsultationsList initialStatus="in-progress" /> },
      { path: "consultations/procedures", element: <Placeholder title="Procedures Board" /> },
      { path: "consultations/:id", element: <ConsultationDetail /> },
      { path: "lab", element: <Placeholder title="Lab & Diagnostic" /> },
      { path: "ipd", element: <Placeholder title="IPD Ward" /> },
      { path: "boarding", element: <Placeholder title="Boarding" /> },
      { path: "grooming", element: <Placeholder title="Grooming" /> },
      { path: "pet-taxi", element: <Placeholder title="Pet Taxi" /> },
      { path: "billing/invoices", element: <Placeholder title="Invoices" /> },
      { path: "billing/payments", element: <Placeholder title="Payments" /> },
      { path: "billing/counter-sales", element: <Placeholder title="Counter Sales" /> },
      { path: "billing/e-invoice", element: <Placeholder title="E-Invoice (VN)" /> },
      { path: "inventory/products", element: <Placeholder title="Products & Services" /> },
      { path: "inventory/stock", element: <Placeholder title="Stock" /> },
      { path: "inventory/movements", element: <Placeholder title="Stock Movements" /> },
      { path: "inventory/purchase-orders", element: <Placeholder title="Purchase Orders" /> },
      { path: "reports", element: <Placeholder title="Reports" /> },
      { path: "nps", element: <Placeholder title="NPS Feedback" /> },
      { path: "communications/zalo", element: <Placeholder title="Zalo" /> },
      { path: "communications/sms", element: <Placeholder title="SMS" /> },
      { path: "communications/email", element: <Placeholder title="Email" /> },
      { path: "communications/reminders", element: <Placeholder title="Reminders" /> },
      { path: "communications/approval-queue", element: <Placeholder title="Approval Queue" /> },
      { path: "communications/bulk-send", element: <Placeholder title="Bulk Send" /> },
      { path: "forms", element: <Placeholder title="Forms & Certificates" /> },
      { path: "admin/users", element: <Placeholder title="Users & Roles" /> },
      { path: "admin/branches", element: <Placeholder title="Branches" /> },
      { path: "admin/registry", element: <Placeholder title="Master Registry" /> },
      { path: "admin/settings", element: <Placeholder title="Settings" /> },
      { path: "admin/integrations", element: <Placeholder title="Integrations" /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LangProvider>
      <LayoutProvider>
        <RouterProvider router={router} />
      </LayoutProvider>
    </LangProvider>
  </React.StrictMode>
);
