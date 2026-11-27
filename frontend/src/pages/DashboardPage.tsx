import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  workOrderService,
  directTransactionService,
  settlementService,
  reportService,
} from "../infrastructure/services";
import { stockApi } from "../api";
import { IssueZigPromptModal } from "./admin/dashboard/IssueZigPromptModal";
import { NewTransactionPromptModal } from "./admin/dashboard/NewTransactionPromptModal";
import { RecordFabricReturnPromptModal } from "./admin/dashboard/RecordFabricReturnPromptModal";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Quick operations modal states
  const [showRecordReturnModal, setShowRecordReturnModal] = useState(false);
  const [showIssueZigModal, setShowIssueZigModal] = useState(false);
  const [showNewTxnModal, setShowNewTxnModal] = useState(false);

  // Attention stats
  const [readyToSettleCount, setReadyToSettleCount] = useState<number>(0);
  const [readyToSettleLabel, setReadyToSettleLabel] = useState<"weavers" | "zigs">("weavers");
  const [readyToSettleAmount, setReadyToSettleAmount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [lowStockYarnCount, setLowStockYarnCount] = useState<number>(0);
  const [lowStockFabricCount, setLowStockFabricCount] = useState<number>(0);
  const [unpaidTxnCount, setUnpaidTxnCount] = useState<number>(0);
  const [unpaidTxnAmount, setUnpaidTxnAmount] = useState<number>(0);

  // Production zig counts
  const [assignedZigs, setAssignedZigs] = useState<number>(0);
  const [inProgressZigs, setInProgressZigs] = useState<number>(0);
  const [returnedZigs, setReturnedZigs] = useState<number>(0);
  const [reconciledZigs, setReconciledZigs] = useState<number>(0);

  // Financial status summary
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [collectedRevenue, setCollectedRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [merchantReceivable, setMerchantReceivable] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ordersRes, stockRes, txnsRes, pendingRes, commercialRes, merchantsBalRes] =
          await Promise.allSettled([
            workOrderService.listWorkOrders(),
            stockApi.get(),
            directTransactionService.listTransactions(),
            settlementService.getPendingSummary(),
            reportService.getCommercialSummary(),
            reportService.getMerchantsBalance(),
          ]);

        // 1. Zigs in production
        if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
          const orders = ordersRes.value;
          const assigned = orders.filter((o) => o.status === "assigned").length;
          const inProgress = orders.filter((o) => o.status === "in_progress").length;
          const returned = orders.filter((o) => o.status === "returned").length;
          const reconciled = orders.filter((o) => o.status === "reconciled").length;

          setAssignedZigs(assigned);
          setInProgressZigs(inProgress);
          setReturnedZigs(returned);
          setReconciledZigs(reconciled);
        }

        // 2. Ready to settle summary
        if (pendingRes.status === "fulfilled" && pendingRes.value) {
          const pending = pendingRes.value;
          const hasWeaverCount = typeof pending.weaverCount === "number";
          const wCount = hasWeaverCount ? (pending.weaverCount ?? 0) : (pending.unsettledZigCount ?? 0);
          const liability = pending.pendingLiability ?? pending.totalPendingAmount ?? 0;
          setReadyToSettleCount(wCount);
          setReadyToSettleLabel(hasWeaverCount ? "weavers" : "zigs");
          setReadyToSettleAmount(liability);
        }

        // 3. Stock counts
        if (stockRes.status === "fulfilled" && stockRes.value) {
          const yarns = stockRes.value.yarnVariants || [];
          const fabrics = stockRes.value.fabricVariants || [];
          const lowY = yarns.filter((y: any) => Number(y.currentStock ?? y.stockSnapshot ?? 0) < 20).length;
          const lowF = fabrics.filter((f: any) => Number(f.currentStock ?? f.stockSnapshot ?? 0) < 20).length;
          setLowStockCount(lowY + lowF);
          setLowStockYarnCount(lowY);
          setLowStockFabricCount(lowF);
        }

        // 4. Unpaid transactions
        if (txnsRes.status === "fulfilled" && Array.isArray(txnsRes.value)) {
          const unpaid = txnsRes.value.filter(
            (t: any) => t.status === "unpaid" || t.status === "partially_paid"
          );
          setUnpaidTxnCount(unpaid.length);
          const sumDue = unpaid.reduce(
            (sum: number, t: any) =>
              sum + (parseFloat(t.totalAmount || "0") - parseFloat(t.amountPaid || t.paidAmount || "0")),
            0
          );
          setUnpaidTxnAmount(sumDue);
        }

        // 5. Financial status summary
        if (commercialRes.status === "fulfilled" && commercialRes.value) {
          const c = commercialRes.value;
          const rev =
            c.revenue?.grossCommercialRevenue ??
            (c.fabricSalesRevenue ?? 0) + (c.yarnSalesRevenue ?? 0);
          const collected =
            (c.revenue?.merchantFabricSalesCollected ?? 0) +
            (c.revenue?.weaverYarnSalesCollected ?? 0);
          const exp =
            c.expenses?.totalExpenses ??
            (c.expenses?.supplierYarnProcurementExpense ?? c.yarnProcurementExpense ?? 0) +
              (c.weaverSettlementsExpense ?? 0) +
              (c.fabricPurchasesExpense ?? 0);
          const profit = c.profitability?.netOperatingProfit ?? rev - exp;

          setGrossRevenue(rev);
          setCollectedRevenue(collected);
          setTotalExpenses(exp);
          setNetProfit(profit);
        }

        if (merchantsBalRes.status === "fulfilled" && Array.isArray(merchantsBalRes.value)) {
          const totalReceivable = merchantsBalRes.value.reduce(
            (sum: number, m: any) => sum + Number(m.outstandingReceivable || 0),
            0
          );
          setMerchantReceivable(totalReceivable);
        }
      } catch {
        // Keep fallback data if offline
      }
    }

    loadStats();
  }, []);

  const adminName = user?.fullName || user?.username || "Admin";
  const formattedToday = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page dashboard-page">
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-date">{formattedToday}</p>
          <h1 className="dashboard-greeting">Good morning, {adminName}</h1>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowRecordReturnModal(true)}
          >
            + Record fabric return
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowIssueZigModal(true)}
          >
            + Issue zig
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowNewTxnModal(true)}
          >
            + New transaction
          </button>
        </div>
      </div>

      {/* Needs your attention */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Needs your attention</h2>
        <div className="attention-grid">
          {/* Card 1: Ready to settle */}
          <div
            className="card attention-card"
            onClick={() => navigate("/admin/settlement")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/admin/settlement");
            }}
            title="Click to review pending settlements"
          >
            <div className="attention-card-header">
              <span className="attention-card-label">Ready to settle</span>
              <span className="attention-card-arrow">→</span>
            </div>
            <div className="attention-card-stat">
              {readyToSettleCount}{" "}
              {readyToSettleLabel === "weavers"
                ? (readyToSettleCount === 1 ? "weaver" : "weavers")
                : (readyToSettleCount === 1 ? "zig" : "zigs")}
            </div>
            <p className="attention-card-sub-compact">
              {readyToSettleAmount.toLocaleString()} ETB from returned zigs
            </p>
          </div>

          {/* Card 2: Low or out of stock */}
          <div
            className="card attention-card attention-card-warning"
            onClick={() => navigate("/admin/stock")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/admin/stock");
            }}
            title="Click to view low inventory stock"
          >
            <div className="attention-card-header">
              <span className="attention-card-label">Low or out of stock</span>
              <span className="attention-card-arrow">→</span>
            </div>
            <div className="attention-card-stat text-warning-rust">
              {lowStockCount} items
            </div>
            <p className="attention-card-sub-compact">
              {lowStockYarnCount} yarn · {lowStockFabricCount} fabric
            </p>
          </div>

          {/* Card 3: Unpaid transactions */}
          <div
            className="card attention-card"
            onClick={() => navigate("/admin/transactions")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/admin/transactions");
            }}
            title="Click to open unpaid transactions"
          >
            <div className="attention-card-header">
              <span className="attention-card-label">Unpaid transactions</span>
              <span className="attention-card-arrow">→</span>
            </div>
            <div className="attention-card-stat">
              {unpaidTxnCount}
            </div>
            <p className="attention-card-sub-compact">
              {unpaidTxnAmount.toLocaleString()} ETB still due
            </p>
          </div>
        </div>
      </section>

      {/* Zigs in production */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Zigs in production</h2>
        </div>
        <div className="zigs-grid">
          {/* Assigned */}
          <Link
            to="/admin/production?status=ongoing"
            className="card zig-stat-card"
            title="View ongoing zigs in production ledger"
          >
            <span className="zig-stat-label">Assigned</span>
            <div className="zig-stat-num">{assignedZigs}</div>
            <span className="zig-stat-sub">awaiting setup</span>
          </Link>

          {/* In progress */}
          <Link
            to="/admin/production?status=ongoing"
            className="card zig-stat-card"
            title="View in-progress zigs in production ledger"
          >
            <span className="zig-stat-label">In progress</span>
            <div className="zig-stat-num">{inProgressZigs}</div>
            <span className="zig-stat-sub">being woven</span>
          </Link>

          {/* Returned (Active highlight) */}
          <Link
            to="/admin/production?status=returned"
            className="card zig-stat-card zig-stat-highlight"
            title="View returned zigs ready to settle"
          >
            <span className="zig-stat-label">Returned</span>
            <div className="zig-stat-num text-highlight-rust">{returnedZigs}</div>
            <span className="zig-stat-sub">ready to settle</span>
          </Link>

          {/* Reconciled */}
          <Link
            to="/admin/production?status=reconciled"
            className="card zig-stat-card"
            title="View reconciled/settled zigs"
          >
            <span className="zig-stat-label">Reconciled</span>
            <div className="zig-stat-num">{reconciledZigs}</div>
            <span className="zig-stat-sub">settled and paid</span>
          </Link>
        </div>
      </section>

      {/* Financial status */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Financial status</h2>
        </div>
        <div className="zigs-grid">
          <Link to="/admin/reports" className="card zig-stat-card">
            <span className="zig-stat-label">Gross revenue</span>
            <div className="zig-stat-num">{grossRevenue.toLocaleString()}</div>
            <span className="zig-stat-sub">
              {collectedRevenue.toLocaleString()} ETB collected
            </span>
          </Link>

          <Link to="/admin/reports" className="card zig-stat-card">
            <span className="zig-stat-label">Total expenses</span>
            <div className="zig-stat-num">{totalExpenses.toLocaleString()}</div>
            <span className="zig-stat-sub">ETB yarn, wages & purchases</span>
          </Link>

          <Link
            to="/admin/reports"
            className={`card zig-stat-card ${netProfit >= 0 ? "" : "zig-stat-highlight"}`}
          >
            <span className="zig-stat-label">Net profit</span>
            <div className={`zig-stat-num ${netProfit < 0 ? "text-highlight-rust" : ""}`}>
              {netProfit.toLocaleString()}
            </div>
            <span className="zig-stat-sub">ETB operating balance</span>
          </Link>

          <Link to="/admin/transactions" className="card zig-stat-card">
            <span className="zig-stat-label">Merchant receivables</span>
            <div className="zig-stat-num">{merchantReceivable.toLocaleString()}</div>
            <span className="zig-stat-sub">ETB outstanding due</span>
          </Link>
        </div>
      </section>

      {/* Quick Operation Prompt Modals */}
      <RecordFabricReturnPromptModal
        isOpen={showRecordReturnModal}
        onClose={() => setShowRecordReturnModal(false)}
      />
      <IssueZigPromptModal
        isOpen={showIssueZigModal}
        onClose={() => setShowIssueZigModal(false)}
      />
      <NewTransactionPromptModal
        isOpen={showNewTxnModal}
        onClose={() => setShowNewTxnModal(false)}
      />

      {/* Footnote */}
      <div className="dashboard-footnote">
        Live operations data · Awra Amba Textile Cooperative
      </div>
    </div>
  );
}

export default DashboardPage;
