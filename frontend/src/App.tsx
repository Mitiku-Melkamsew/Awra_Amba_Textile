import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomeRedirect, ProtectedRoute, RoleRoute } from "./components/auth";
import { Layout, MerchantLayout, WeaverLayout } from "./components/layout";
import { AuthProvider } from "./context/AuthContext";

// Lazy-loaded Public Pages
const PublicHomePage = lazy(() => import("./pages/PublicHomePage").then((m) => ({ default: m.PublicHomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then((m) => ({ default: m.SignUpPage })));

// Lazy-loaded Admin Pages
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const ProductionReportPage = lazy(() => import("./pages/admin/ProductionReportPage").then((m) => ({ default: m.ProductionReportPage })));
const SettlementPage = lazy(() => import("./pages/SettlementPage").then((m) => ({ default: m.SettlementPage })));
const NewSettlementRunPage = lazy(() => import("./pages/settlement/NewSettlementRunPage").then((m) => ({ default: m.NewSettlementRunPage })));
const SettlementRunDetailPage = lazy(() => import("./pages/settlement/SettlementRunDetailPage").then((m) => ({ default: m.SettlementRunDetailPage })));
const SettlementPreviewPage = lazy(() => import("./pages/admin/SettlementPreviewPage").then((m) => ({ default: m.SettlementPreviewPage })));
const SettlementHistoryPage = lazy(() => import("./pages/admin/SettlementHistoryPage").then((m) => ({ default: m.SettlementHistoryPage })));
const CatalogPage = lazy(() => import("./pages/admin/CatalogPage").then((m) => ({ default: m.CatalogPage })));
const PricesPage = lazy(() => import("./pages/admin/PricesPage").then((m) => ({ default: m.PricesPage })));
const QualityRulesPage = lazy(() => import("./pages/admin/QualityRulesPage").then((m) => ({ default: m.QualityRulesPage })));
const UsersPage = lazy(() => import("./pages/admin/UsersPage").then((m) => ({ default: m.UsersPage })));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage })));
const HisabPrintPage = lazy(() => import("./pages/admin/HisabPrintPage").then((m) => ({ default: m.HisabPrintPage })));
const IssueZigPage = lazy(() => import("./pages/admin/IssueZigPage").then((m) => ({ default: m.IssueZigPage })));
const StockPage = lazy(() => import("./pages/admin/StockPage").then((m) => ({ default: m.StockPage })));
const WeaverProfilePage = lazy(() => import("./pages/admin/WeaverProfilePage").then((m) => ({ default: m.WeaverProfilePage })));
const WeaversPage = lazy(() => import("./pages/admin/WeaversPage").then((m) => ({ default: m.WeaversPage })));
const ZigDetailPage = lazy(() => import("./pages/admin/ZigDetailPage").then((m) => ({ default: m.ZigDetailPage })));
const TransactionDetailPage = lazy(() => import("./pages/admin/transactions/TransactionDetailPage").then((m) => ({ default: m.TransactionDetailPage })));
const TransactionFormPage = lazy(() => import("./pages/admin/transactions/TransactionFormPage").then((m) => ({ default: m.TransactionFormPage })));
const TransactionsHubPage = lazy(() => import("./pages/admin/transactions/TransactionsHubPage").then((m) => ({ default: m.TransactionsHubPage })));

// Lazy-loaded Weaver & Merchant Pages
const WeaverPaymentsPage = lazy(() => import("./pages/weaver/WeaverPaymentsPage").then((m) => ({ default: m.WeaverPaymentsPage })));
const WeaverPortalPage = lazy(() => import("./pages/weaver/WeaverPortalPage").then((m) => ({ default: m.WeaverPortalPage })));
const WeaverZigsPage = lazy(() => import("./pages/weaver/WeaverZigsPage").then((m) => ({ default: m.WeaverZigsPage })));
const WeaverZigDetailPage = lazy(() => import("./pages/weaver/WeaverZigDetailPage").then((m) => ({ default: m.WeaverZigDetailPage })));
const WeaverRatesPage = lazy(() => import("./pages/weaver/WeaverRatesPage").then((m) => ({ default: m.WeaverRatesPage })));
const WeaverCalculatorPage = lazy(() => import("./pages/weaver/WeaverCalculatorPage").then((m) => ({ default: m.WeaverCalculatorPage })));
const MerchantFabricsPage = lazy(() => import("./pages/merchant/MerchantFabricsPage").then((m) => ({ default: m.MerchantFabricsPage })));
const MerchantPricesPage = lazy(() => import("./pages/merchant/MerchantPricesPage").then((m) => ({ default: m.MerchantPricesPage })));

function RouteLoadingFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh", color: "var(--text-muted, #64748b)", fontSize: "0.95rem" }}>
      <span>Loading...</span>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
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
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="weavers" element={<WeaversPage />} />
                  <Route path="weavers/:userId" element={<WeaverProfilePage />} />
                  <Route path="weavers/:userId/issue-zig" element={<IssueZigPage />} />
                  <Route path="zigs/:zigId" element={<ZigDetailPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="prices" element={<PricesPage />} />
                  <Route path="quality-rules" element={<QualityRulesPage />} />
                  <Route path="stock" element={<StockPage />} />
                  <Route path="transactions" element={<TransactionsHubPage />} />
                  <Route path="transactions/new" element={<TransactionFormPage />} />
                  <Route path="transactions/new/:direction" element={<TransactionFormPage />} />
                  <Route path="transactions/new/:direction/:goods" element={<TransactionFormPage />} />
                  <Route path="transactions/:transactionId" element={<TransactionDetailPage />} />
                  <Route path="catalog" element={<CatalogPage />} />
                  <Route path="settlement" element={<SettlementPage />} />
                  <Route path="settlement/new" element={<NewSettlementRunPage />} />
                  <Route path="settlement/runs/:runId" element={<SettlementRunDetailPage />} />
                  <Route path="settlement/history" element={<SettlementHistoryPage />} />
                  <Route path="settlement/history/:id" element={<SettlementRunDetailPage />} />
                  <Route path="settlement/preview/:previewId" element={<SettlementPreviewPage />} />
                  <Route path="reports/hisab/:type/:id" element={<HisabPrintPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/production" element={<ProductionReportPage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                </Route>
              </Route>

              {/* Weaver Routes */}
              <Route path="/weaver" element={<RoleRoute role="weaver" redirectTo="/merchant" />}>
                <Route element={<WeaverLayout />}>
                  <Route index element={<WeaverPortalPage />} />
                  <Route path="zigs" element={<WeaverZigsPage />} />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
