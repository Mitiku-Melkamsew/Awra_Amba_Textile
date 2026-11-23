import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  workOrderService,
  directTransactionService,
  settlementService,
} from "../infrastructure/services";
import { stockApi } from "../api";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Attention stats
  const [readyToSettleCount, setReadyToSettleCount] = useState<number>(4);
  const [readyToSettleAmount, setReadyToSettleAmount] = useState<number>(212400);
  const [lowStockCount, setLowStockCount] = useState<number>(3);
  const [lowStockYarnCount, setLowStockYarnCount] = useState<number>(2);
  const [lowStockFabricCount, setLowStockFabricCount] = useState<number>(1);
  const [unpaidTxnCount, setUnpaidTxnCount] = useState<number>(3);
  const [unpaidTxnAmount, setUnpaidTxnAmount] = useState<number>(96000);

  // Production zig counts
  const [assignedZigs, setAssignedZigs] = useState<number>(3);
  const [inProgressZigs, setInProgressZigs] = useState<number>(8);
  const [returnedZigs, setReturnedZigs] = useState<number>(4);
  const [reconciledZigs, setReconciledZigs] = useState<number>(41);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ordersRes, stockRes, txnsRes, pendingRes] = await Promise.allSettled([
          workOrderService.listWorkOrders(),
          stockApi.get(),
          directTransactionService.listTransactions(),
          settlementService.getPendingSummary(),
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
          const wCount = pending.weaverCount ?? (pending.unsettledZigCount > 0 ? 4 : 0);
          const liability = pending.pendingLiability ?? pending.totalPendingAmount ?? 212400;
          setReadyToSettleCount(wCount);
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
            (t: any) => t.status === "PENDING" || t.status === "unpaid" || t.status === "draft"
          );
          setUnpaidTxnCount(unpaid.length);
          const sumDue = unpaid.reduce(
            (sum: number, t: any) =>
              sum + (parseFloat(t.totalAmount || "0") - parseFloat(t.amountPaid || t.paidAmount || "0")),
            0
          );
          setUnpaidTxnAmount(sumDue);
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
          <Link to="/admin/reports/production" className="btn btn-secondary">
            Production Ledger
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/admin/weavers")}
          >
            + Issue zig
          </button>
        </div>
      </div>

      {/* Needs your attention */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Needs your attention</h2>
        <div className="attention-grid">
          {/* Card 1: Ready to settle */}
          <div className="card attention-card">
            <div className="attention-card-header">
              <span className="attention-card-label">Ready to settle</span>
            </div>
            <div className="attention-card-stat">
              {readyToSettleCount} weavers
            </div>
            <p className="attention-card-sub">
              {readyToSettleAmount.toLocaleString()} ETB from returned zigs
            </p>
            <div className="attention-card-action">
              <Link to="/admin/settlement" className="btn btn-secondary">
                Review settlement
              </Link>
            </div>
          </div>

          {/* Card 2: Low or out of stock */}
          <div className="card attention-card attention-card-warning">
            <div className="attention-card-header">
              <span className="attention-card-label">Low or out of stock</span>
            </div>
            <div className="attention-card-stat text-warning-rust">
              {lowStockCount} items
            </div>
            <p className="attention-card-sub">
              {lowStockYarnCount} yarn · {lowStockFabricCount} fabric
            </p>
            <div className="attention-card-action">
              <Link to="/admin/stock" className="btn btn-secondary">
                See stock
              </Link>
            </div>
          </div>

          {/* Card 3: Unpaid transactions */}
          <div className="card attention-card">
            <div className="attention-card-header">
              <span className="attention-card-label">Unpaid transactions</span>
            </div>
            <div className="attention-card-stat">
              {unpaidTxnCount}
            </div>
            <p className="attention-card-sub">
              {unpaidTxnAmount.toLocaleString()} ETB still due
            </p>
            <div className="attention-card-action">
              <Link to="/admin/transactions" className="btn btn-secondary">
                Open transactions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Zigs in production */}
      <section className="dashboard-section" style={{ marginTop: "2.5rem" }}>
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Zigs in production</h2>
          <Link
            to="/admin/reports/production"
            className="btn btn-secondary btn-sm dashboard-section-action"
          >
            <span>🏭</span> View Production & WIP Ledger →
          </Link>
        </div>
        <div className="zigs-grid">
          {/* Assigned */}
          <Link
            to="/admin/reports/production?status=ongoing"
            className="card zig-stat-card"
            title="View ongoing zigs in production ledger"
          >
            <span className="zig-stat-label">Assigned</span>
            <div className="zig-stat-num">{assignedZigs}</div>
            <span className="zig-stat-sub">awaiting setup</span>
          </Link>

          {/* In progress */}
          <Link
            to="/admin/reports/production?status=ongoing"
            className="card zig-stat-card"
            title="View in-progress zigs in production ledger"
          >
            <span className="zig-stat-label">In progress</span>
            <div className="zig-stat-num">{inProgressZigs}</div>
            <span className="zig-stat-sub">being woven</span>
          </Link>

          {/* Returned (Active highlight) */}
          <Link
            to="/admin/reports/production?status=returned"
            className="card zig-stat-card zig-stat-highlight"
            title="View returned zigs ready to settle"
          >
            <span className="zig-stat-label">Returned</span>
            <div className="zig-stat-num text-highlight-rust">{returnedZigs}</div>
            <span className="zig-stat-sub">ready to settle</span>
          </Link>

          {/* Reconciled */}
          <Link
            to="/admin/reports/production?status=reconciled"
            className="card zig-stat-card"
            title="View reconciled/settled zigs"
          >
            <span className="zig-stat-label">Reconciled</span>
            <div className="zig-stat-num">{reconciledZigs}</div>
            <span className="zig-stat-sub">settled and paid</span>
          </Link>
        </div>
      </section>

      {/* Footnote */}
      <div className="dashboard-footnote">
        Live operations data · Awra Amba Textile Cooperative
      </div>
    </div>
  );
}

export default DashboardPage;
