import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paymentsApi } from "../api";
import { reportService } from "../infrastructure/services";
import { formatDateDDMMYY } from "../utils/formatDate";

export function ReportsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"month" | "30days" | "year" | "all" | "custom">("year");

  // Summary financials
  const [revenueBilled, setRevenueBilled] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [fabricSoldToMerchants, setFabricSoldToMerchants] = useState<number>(0);
  const [fabricCollected, setFabricCollected] = useState<number>(0);
  const [yarnSoldToWeavers, setYarnSoldToWeavers] = useState<number>(0);
  const [yarnCollected, setYarnCollected] = useState<number>(0);

  const [yarnBoughtSuppliers, setYarnBoughtSuppliers] = useState<number>(0);
  const [weaverSettlementsPaid, setWeaverSettlementsPaid] = useState<number>(0);
  const [fabricBoughtWeavers, setFabricBoughtWeavers] = useState<number>(0);

  // Dynamic lists for liabilities and receivables
  const [weaversOwed, setWeaversOwed] = useState<Array<{ name: string; meta: string; amount: string }>>([]);
  const [merchantsOwed, setMerchantsOwed] = useState<Array<{ name: string; amount: string }>>([]);

  // Statements list state (when expanded)
  const [showHisabList, setShowHisabList] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch live commercial summary
    reportService
      .getCommercialSummary()
      .then((data) => {
        if (data) {
          const fabricRev = data.revenue?.merchantFabricSalesTotal ?? data.fabricSalesRevenue ?? 0;
          const fabricCol = data.revenue?.merchantFabricSalesCollected ?? 0;
          const yarnRev = data.revenue?.weaverYarnSalesTotal ?? data.yarnSalesRevenue ?? 0;
          const yarnCol = data.revenue?.weaverYarnSalesCollected ?? 0;
          const totalRev = data.revenue?.grossCommercialRevenue ?? (fabricRev + yarnRev);

          const yarnExp = data.expenses?.supplierYarnProcurementExpense ?? data.yarnProcurementExpense ?? 0;
          const settlementExp = data.expenses?.weaverSettlementPayouts ?? data.weaverSettlementsExpense ?? 0;
          const fabricExp = data.expenses?.weaverDirectFabricPurchases ?? data.fabricPurchasesExpense ?? 0;
          const totalExp = data.expenses?.totalExpenses ?? (yarnExp + settlementExp + fabricExp);

          setFabricSoldToMerchants(fabricRev);
          setFabricCollected(fabricCol);
          setYarnSoldToWeavers(yarnRev);
          setYarnCollected(yarnCol);
          setRevenueBilled(totalRev);

          setYarnBoughtSuppliers(yarnExp);
          setWeaverSettlementsPaid(settlementExp);
          setFabricBoughtWeavers(fabricExp);
          setExpenses(totalExp);
        }
      })
      .catch(() => {});

    // 2. Fetch live weavers balance report
    reportService
      .getWeaversBalance()
      .then((balances) => {
        if (Array.isArray(balances) && balances.length > 0) {
          const active = balances
            .filter((w) => (w.netPayableBalance && w.netPayableBalance > 0) || w.unsettledPiecesCount > 0)
            .map((w) => ({
              name: w.fullName,
              meta: w.unsettledPiecesCount > 0
                ? `${w.unsettledPiecesCount} zigs ready to settle`
                : "Ready for settlement",
              amount: `${Math.round(w.netPayableBalance || w.estimatedPendingPayout || 0).toLocaleString()} ETB`,
            }));
          if (active.length > 0) {
            setWeaversOwed(active.slice(0, 5));
          } else {
            const pending = balances
              .filter((w) => (w.estimatedPendingPayout || 0) > 0)
              .map((w) => ({
                name: w.fullName,
                meta: `${w.activeWorkOrdersCount || 0} zigs in progress`,
                amount: `${Math.round(w.estimatedPendingPayout || 0).toLocaleString()} ETB`,
              }));
            setWeaversOwed(pending.slice(0, 5));
          }
        } else {
          setWeaversOwed([]);
        }
      })
      .catch(() => {});

    // 3. Fetch live merchants balance report
    reportService
      .getMerchantsBalance()
      .then((balances) => {
        if (Array.isArray(balances) && balances.length > 0) {
          const mapped = balances
            .filter((m: any) => (m.totalReceivableBalance && m.totalReceivableBalance > 0) || m.unpaidSalesCount > 0)
            .map((m: any) => ({
              name: m.fullName || m.username || "Merchant",
              amount: `${Math.round(m.totalReceivableBalance || 0).toLocaleString()} ETB`,
            }));
          setMerchantsOwed(mapped.slice(0, 5));
        } else {
          setMerchantsOwed([]);
        }
      })
      .catch(() => {});

    // 4. Fetch recorded payment statements
    paymentsApi
      .list()
      .then((res) => {
        if (Array.isArray(res)) setPayments(res);
      })
      .catch(() => {});
  }, []);

  const netOperatingProfit = revenueBilled - expenses;

  return (
    <div className="page reports-page">
      {/* ── Page Header ── */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">
            Reports <span className="reports-title-amharic">· ሪፖርቶች</span>
          </h1>
          <p className="reports-subtitle">
            Financial performance, revenues, expenses, and artisan balances
          </p>
        </div>

        <div className="reports-header-actions">
          <Link to="/admin/reports/production" className="btn btn-secondary">
            <span>🏭</span> Production & WIP Ledger →
          </Link>
        </div>
      </div>

      {/* ── Section Segmented Navigation Tabs ── */}
      <div className="reports-segmented-tabs">
        <Link to="/admin/reports" className="reports-segmented-tab active">
          Financial Overview
        </Link>
        <Link to="/admin/reports/production" className="reports-segmented-tab">
          Production & WIP Ledger
        </Link>
      </div>

      {/* ── Period Filter Chips ── */}
      <div className="reports-period-row">
        <span className="reports-period-label">Period</span>
        <div className="reports-chips-group">
          <button
            type="button"
            className={`period-chip ${period === "month" ? "active" : ""}`}
            onClick={() => setPeriod("month")}
          >
            This month
          </button>
          <button
            type="button"
            className={`period-chip ${period === "30days" ? "active" : ""}`}
            onClick={() => setPeriod("30days")}
          >
            Last 30 days
          </button>
          <button
            type="button"
            className={`period-chip ${period === "year" ? "active" : ""}`}
            onClick={() => setPeriod("year")}
          >
            This year
          </button>
          <button
            type="button"
            className={`period-chip ${period === "all" ? "active" : ""}`}
            onClick={() => setPeriod("all")}
          >
            All time
          </button>
          <button
            type="button"
            className={`period-chip ${period === "custom" ? "active" : ""}`}
            onClick={() => setPeriod("custom")}
          >
            Custom dates...
          </button>
        </div>
      </div>

      {/* ── Top 3 Metric Cards ── */}
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Revenue (billed)</span>
          <div className="reports-kpi-num">{revenueBilled.toLocaleString()}</div>
          <span className="reports-kpi-sub">ETB total billed</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Expenses</span>
          <div className="reports-kpi-num">{expenses.toLocaleString()}</div>
          <span className="reports-kpi-sub">ETB yarn, settlements & fabric</span>
        </div>

        <div className="reports-kpi-card reports-kpi-peach">
          <span className="reports-kpi-label">Net operating profit</span>
          <div className="reports-kpi-num rust">
            {netOperatingProfit.toLocaleString()}
          </div>
          <span className="reports-kpi-sub">ETB · revenue minus expenses</span>
        </div>
      </div>

      {/* ── Main Breakdown Section ── */}
      <div className="reports-main-layout">
        {/* Left Column */}
        <div className="reports-left-col">
          {/* Revenue & Expenses Detail Card */}
          <div className="reports-card">
            <div className="breakdown-columns-grid">
              {/* Revenue column */}
              <div>
                <h3 className="breakdown-col-title">Revenue</h3>
                <div className="breakdown-row">
                  <div className="breakdown-row-left">
                    <span className="breakdown-row-label">Fabric sold to merchants</span>
                    <span className="breakdown-row-sub">
                      collected {fabricCollected.toLocaleString()} ETB
                    </span>
                  </div>
                  <span className="breakdown-row-val">{fabricSoldToMerchants.toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <div className="breakdown-row-left">
                    <span className="breakdown-row-label">Yarn sold to weavers</span>
                    <span className="breakdown-row-sub">
                      collected {yarnCollected.toLocaleString()} ETB
                    </span>
                  </div>
                  <span className="breakdown-row-val">{yarnSoldToWeavers.toLocaleString()}</span>
                </div>
              </div>

              {/* Expenses column */}
              <div>
                <h3 className="breakdown-col-title">Expenses</h3>
                <div className="breakdown-row">
                  <span className="breakdown-row-label">Yarn bought from suppliers</span>
                  <span className="breakdown-row-val">{yarnBoughtSuppliers.toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-row-label">Weaver settlements paid</span>
                  <span className="breakdown-row-val">{weaverSettlementsPaid.toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-row-label">Fabric bought from weavers</span>
                  <span className="breakdown-row-val">{fabricBoughtWeavers.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="reports-callout-info">
              <span className="reports-callout-icon">ⓘ</span>
              <p className="reports-callout-text">
                <strong>Accounting basis:</strong> Sales and weaver purchases are counted by the amount
                billed, settlements only once paid. Please confirm this basis with your accountant
                before generating financial records for the General Assembly.
              </p>
            </div>
          </div>

          {/* HISAB settlement statements card */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">HISAB settlement statements</h3>
                <p className="reports-card-sub">
                  Print or download individual statement receipts for each payment
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowHisabList(!showHisabList)}
              >
                {showHisabList ? "Close ✕" : "Open Statements >"}
              </button>
            </div>

            {/* Collapsible statement ledger table */}
            {showHisabList && (
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th className="reports-th">Ref #</th>
                      <th className="reports-th">Artisan Weaver</th>
                      <th className="reports-th">Payment Date</th>
                      <th className="reports-th text-right">Amount</th>
                      <th className="reports-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="reports-td text-center" style={{ color: "#64748B", padding: "2rem" }}>
                          No recorded payments found.
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 5).map((p) => (
                        <tr key={p.paymentId} className="reports-tr">
                          <td className="reports-td" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                            #{p.paymentId}
                          </td>
                          <td className="reports-td">
                            {p.weaver?.fullName}
                          </td>
                          <td className="reports-td">
                            {formatDateDDMMYY(p.paymentDate)}
                          </td>
                          <td className="reports-td text-right">
                            <strong>{parseFloat(p.amount || "0").toLocaleString()} ETB</strong>
                          </td>
                          <td className="reports-td text-right">
                            <Link
                              to={`/admin/reports/hisab/payment/${p.paymentId}?print=1`}
                              className="btn btn-secondary btn-sm"
                              target="_blank"
                            >
                              🖨 Receipt
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Owed to weavers & Owed by merchants */}
        <div className="reports-right-col">
          {/* Card 1: Owed to weavers */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">Owed to weavers</h3>
                <p className="reports-card-sub">
                  Returned zigs not yet settled, and unpaid fabric purchases
                </p>
              </div>
              <span className="badge-ready-settle">{weaversOwed.length} weavers</span>
            </div>

            <div className="owed-list">
              {weaversOwed.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-secondary, #666)", fontSize: "13px" }}>
                  No outstanding weaver settlements pending.
                </div>
              ) : (
                weaversOwed.map((w, idx) => (
                  <div key={idx} className="owed-item">
                    <div className="owed-item-left">
                      <span className="owed-item-name">{w.name}</span>
                      <span className="owed-item-meta">{w.meta}</span>
                    </div>
                    <span className="owed-item-amount">{w.amount}</span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full-width"
              onClick={() => navigate("/admin/weavers")}
            >
              See all weavers →
            </button>
          </div>

          {/* Card 2: Owed by merchants */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">Owed by merchants</h3>
                <p className="reports-card-sub">Unpaid fabric sales receivables</p>
              </div>
              <span className="badge-ready-settle">{merchantsOwed.length} merchants</span>
            </div>

            <div className="owed-list">
              {merchantsOwed.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-text-secondary, #666)", fontSize: "13px" }}>
                  No outstanding merchant receivables pending.
                </div>
              ) : (
                merchantsOwed.map((m, idx) => (
                  <div key={idx} className="owed-item">
                    <span className="owed-item-name">{m.name}</span>
                    <span className="owed-item-amount">{m.amount}</span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full-width"
              onClick={() => navigate("/admin/transactions")}
            >
              See all merchants →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
