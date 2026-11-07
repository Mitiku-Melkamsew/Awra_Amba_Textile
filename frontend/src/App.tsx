import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomeRedirect } from "./components/HomeRedirect";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { WeaverLayout } from "./components/WeaverLayout";
import { MerchantLayout } from "./components/MerchantLayout";
import { AuthProvider } from "./context/AuthContext";

// Pages
import { PublicHomePage } from "./pages/PublicHomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettlementPage } from "./pages/SettlementPage";
import { SettlementPreviewPage } from "./pages/admin/SettlementPreviewPage";
import { SettlementHistoryPage } from "./pages/admin/SettlementHistoryPage";
import { CatalogPage } from "./pages/admin/CatalogPage";
import { PricesPage } from "./pages/admin/PricesPage";
import { QualityRulesPage } from "./pages/admin/QualityRulesPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { HisabPrintPage } from "./pages/admin/HisabPrintPage";
import { IssueZigPage } from "./pages/admin/IssueZigPage";
import { StockPage } from "./pages/admin/StockPage";
import { WeaverProfilePage } from "./pages/admin/WeaverProfilePage";
import { WeaversPage } from "./pages/admin/WeaversPage";
import { ZigDetailPage } from "./pages/admin/ZigDetailPage";
import { TransactionDetailPage } from "./pages/admin/transactions/TransactionDetailPage";
import { TransactionFormPage } from "./pages/admin/transactions/TransactionFormPage";
import { TransactionNewPage } from "./pages/admin/transactions/TransactionNewPage";
import { TransactionTypePage } from "./pages/admin/transactions/TransactionTypePage";
import { TransactionsHubPage } from "./pages/admin/transactions/TransactionsHubPage";

// Weaver & Merchant Pages
import { WeaverPaymentsPage } from "./pages/weaver/WeaverPaymentsPage";
import { WeaverPortalPage } from "./pages/weaver/WeaverPortalPage";
import { WeaverZigDetailPage } from "./pages/weaver/WeaverZigDetailPage";
import { WeaverRatesPage } from "./pages/weaver/WeaverRatesPage";
import { WeaverCalculatorPage } from "./pages/weaver/WeaverCalculatorPage";
import { MerchantFabricsPage } from "./pages/merchant/MerchantFabricsPage";
import { MerchantPricesPage } from "./pages/merchant/MerchantPricesPage";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin Routes */}
            <Route path="/admin" element={<RoleRoute role="admin" redirectTo="/weaver" />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/admin/weavers" replace />} />
                <Route path="weavers" element={<WeaversPage />} />
                <Route path="weavers/:weaverId" element={<WeaverProfilePage />} />
                <Route path="weavers/:weaverId/issue-zig" element={<IssueZigPage />} />
                <Route path="zigs/:zigId" element={<ZigDetailPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="prices" element={<PricesPage />} />
                <Route path="quality-rules" element={<QualityRulesPage />} />
                <Route path="procurement" element={<Navigate to="/admin/transactions" replace />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="transactions" element={<TransactionsHubPage />} />
                <Route path="transactions/new" element={<TransactionNewPage />} />
                <Route path="transactions/new/:direction" element={<TransactionTypePage />} />
                <Route path="transactions/new/:direction/:goods" element={<TransactionFormPage />} />
                <Route path="transactions/:transactionId" element={<TransactionDetailPage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="settlement" element={<SettlementPage />} />
                <Route path="settlement/history" element={<SettlementHistoryPage />} />
                <Route path="settlement/preview/:previewId" element={<SettlementPreviewPage />} />
                <Route path="reports/hisab/:paymentId" element={<HisabPrintPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="calculator" element={<Navigate to="/admin/weavers?tab=calculator" replace />} />
              </Route>
            </Route>

            {/* Weaver Routes */}
            <Route path="/weaver" element={<RoleRoute role="weaver" redirectTo="/merchant" />}>
              <Route element={<WeaverLayout />}>
                <Route index element={<WeaverPortalPage />} />
                <Route path="zigs/:zigId" element={<WeaverZigDetailPage />} />
                <Route path="rates" element={<WeaverRatesPage />} />
                <Route path="calculator" element={<WeaverCalculatorPage />} />
                <Route path="payments" element={<WeaverPaymentsPage />} />
              </Route>
            </Route>

            {/* Merchant Routes */}
            <Route path="/merchant" element={<RoleRoute role="merchant" redirectTo="/weaver" />}>
              <Route element={<MerchantLayout />}>
                <Route index element={<MerchantFabricsPage />} />
                <Route path="fabrics" element={<MerchantFabricsPage />} />
                <Route path="prices" element={<MerchantPricesPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
