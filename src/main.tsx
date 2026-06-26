import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { LangProvider } from "@/lib/i18n";
import { LayoutProvider } from "@/lib/layout-mode";
import { SearchProvider } from "@/lib/search-context";
import { AppShell } from "@/components/layout/app-shell";
import DashboardCS from "@/pages/dashboard-cs";
import ConsultationsList from "@/pages/consultations-list";
import ConsultationDetail from "@/pages/consultation-detail";
import SchedulePage from "@/pages/schedule";
import PatientsPage from "@/pages/patients";
import PatientDetailPage from "@/pages/patient-detail";
import CommunicationsPage from "@/pages/communications";
import BranchesPage from "@/pages/branches";
import ProceduresPage from "@/pages/procedures";
import BillingPage from "@/pages/billing";
import CatalogPage from "@/pages/catalog";
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
      { path: "patients", element: <PatientsPage /> },
      { path: "patients/:id", element: <PatientDetailPage /> },
      { path: "consultations", element: <ConsultationsList /> },
      { path: "consultations/all", element: <ConsultationsList /> },
      { path: "consultations/in-progress", element: <ConsultationsList initialStatus="in-progress" /> },
      { path: "consultations/procedures", element: <ProceduresPage /> },
      { path: "consultations/:id", element: <ConsultationDetail /> },
      { path: "lab", element: <Placeholder title="Lab & Diagnostic" /> },
      { path: "ipd", element: <Placeholder title="IPD Ward" /> },
      { path: "boarding", element: <Placeholder title="Boarding" /> },
      { path: "grooming", element: <Placeholder title="Grooming" /> },
      { path: "pet-taxi", element: <Placeholder title="Pet Taxi" /> },
      { path: "billing", element: <Navigate to="/billing/invoices" replace /> },
      { path: "billing/invoices", element: <BillingPage key="invoices" initialView="invoices" /> },
      { path: "billing/payments", element: <BillingPage key="payments" initialView="payments" /> },
      { path: "billing/counter-sales", element: <BillingPage key="counter" initialView="counter" /> },
      { path: "billing/e-invoice", element: <BillingPage key="einvoice" initialView="einvoice" /> },
      { path: "inventory/products", element: <Placeholder title="Products & Services" /> },
      { path: "inventory/stock", element: <Placeholder title="Stock" /> },
      { path: "inventory/movements", element: <Placeholder title="Stock Movements" /> },
      { path: "inventory/purchase-orders", element: <Placeholder title="Purchase Orders" /> },
      { path: "reports", element: <Placeholder title="Reports" /> },
      { path: "nps", element: <Placeholder title="NPS Feedback" /> },
      { path: "communications", element: <Navigate to="/communications/inbox" replace /> },
      { path: "communications/inbox", element: <CommunicationsPage key="inbox" initialView="inbox" /> },
      { path: "communications/whatsapp", element: <CommunicationsPage key="whatsapp" initialView="inbox" initialChannel="whatsapp" /> },
      { path: "communications/zalo", element: <CommunicationsPage key="zalo" initialView="inbox" initialChannel="zalo" /> },
      { path: "communications/sms", element: <CommunicationsPage key="sms" initialView="inbox" initialChannel="sms" /> },
      { path: "communications/email", element: <CommunicationsPage key="email" initialView="inbox" initialChannel="email" /> },
      { path: "communications/reminders", element: <CommunicationsPage key="reminders" initialView="reminders" /> },
      { path: "communications/approval-queue", element: <CommunicationsPage key="approvals" initialView="approvals" /> },
      { path: "communications/bulk-send", element: <CommunicationsPage key="bulk" initialView="bulk" /> },
      { path: "communications/templates", element: <CommunicationsPage key="templates" initialView="templates" /> },
      { path: "forms", element: <Placeholder title="Forms & Certificates" /> },
      { path: "admin/users", element: <Placeholder title="Users & Roles" /> },
      { path: "admin/branches", element: <BranchesPage /> },
      { path: "admin/registry", element: <CatalogPage /> },
      { path: "admin/settings", element: <Placeholder title="Settings" /> },
      { path: "admin/integrations", element: <Placeholder title="Integrations" /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LangProvider>
      <SearchProvider>
        <LayoutProvider>
          <RouterProvider router={router} />
        </LayoutProvider>
      </SearchProvider>
    </LangProvider>
  </React.StrictMode>
);
