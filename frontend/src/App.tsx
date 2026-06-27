import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomeRedirect } from "./components/HomeRedirect";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { WeaverLayout } from "./components/WeaverLayout";
import { AuthProvider } from "./context/AuthContext";
import { CalculatorPage } from "./pages/CalculatorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettlementPage } from "./pages/SettlementPage";
import { WeaversPage } from "./pages/WeaversPage";
import { WorkOrderDetailPage } from "./pages/WorkOrderDetailPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { WeaverHomePage } from "./pages/weaver/WeaverHomePage";
import { WeaverPaymentsPage } from "./pages/weaver/WeaverPaymentsPage";
import { WeaverZigDetailPage } from "./pages/weaver/WeaverZigDetailPage";
import { WeaverZigsPage } from "./pages/weaver/WeaverZigsPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute role="admin" redirectTo="/weaver" />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/weavers" element={<WeaversPage />} />
                <Route path="/work-orders" element={<WorkOrdersPage />} />
                <Route path="/work-orders/:zigId" element={<WorkOrderDetailPage />} />
                <Route path="/settlement" element={<SettlementPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
              </Route>
            </Route>
            <Route element={<RoleRoute role="weaver" redirectTo="/" />}>
              <Route element={<WeaverLayout />}>
                <Route path="/weaver" element={<WeaverHomePage />} />
                <Route path="/weaver/zigs" element={<WeaverZigsPage />} />
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