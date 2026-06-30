import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomeRedirect } from "./components/HomeRedirect";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { WeaverLayout } from "./components/WeaverLayout";
import { AuthProvider } from "./context/AuthContext";
import { CalculatorPage } from "./pages/CalculatorPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicHomePage } from "./pages/PublicHomePage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettlementPage } from "./pages/SettlementPage";
import { SignUpPage } from "./pages/SignUpPage";
import { CatalogPage } from "./pages/admin/CatalogPage";
import { HisabPrintPage } from "./pages/admin/HisabPrintPage";
import { IssueZigPage } from "./pages/admin/IssueZigPage";
import { ProcurementPage } from "./pages/admin/ProcurementPage";
import { StockPage } from "./pages/admin/StockPage";
import { WeaverProfilePage } from "./pages/admin/WeaverProfilePage";
import { WeaversPage } from "./pages/admin/WeaversPage";
import { ZigDetailPage } from "./pages/admin/ZigDetailPage";
import { WeaverPaymentsPage } from "./pages/weaver/WeaverPaymentsPage";
import { WeaverPortalPage } from "./pages/weaver/WeaverPortalPage";
import { WeaverZigDetailPage } from "./pages/weaver/WeaverZigDetailPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute role="admin" redirectTo="/weaver" />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<Navigate to="/admin/weavers" replace />} />
                <Route path="/admin/weavers" element={<WeaversPage />} />
                <Route path="/admin/weavers/:weaverId" element={<WeaverProfilePage />} />
                <Route path="/admin/weavers/:weaverId/issue-zig" element={<IssueZigPage />} />
                <Route path="/admin/zigs/:zigId" element={<ZigDetailPage />} />
                <Route path="/admin/stock" element={<StockPage />} />
                <Route path="/admin/procurement" element={<ProcurementPage />} />
                <Route path="/admin/catalog" element={<CatalogPage />} />
                <Route path="/admin/settlement" element={<SettlementPage />} />
                <Route path="/admin/reports/hisab/:paymentId" element={<HisabPrintPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/calculator" element={<CalculatorPage />} />
              </Route>
            </Route>
            <Route element={<RoleRoute role="weaver" redirectTo="/admin/weavers" />}>
              <Route element={<WeaverLayout />}>
                <Route path="/weaver" element={<WeaverPortalPage />} />
                <Route path="/weaver/zigs/:zigId" element={<WeaverZigDetailPage />} />
                <Route path="/weaver/payments" element={<WeaverPaymentsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;