import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paymentsApi } from "../api";
import { reportService } from "../infrastructure/services";
import { formatDateDDMMYY } from "../utils/formatDate";

export function ReportsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"month" | "30days" | "year" | "all" | "custom">("year");

  // Summary financials
  const [revenueBilled, setRevenueBilled] = useState<number>(580000);
  const [expenses, setExpenses] = useState<number>(440000);
  const [fabricSoldToMerchants, setFabricSoldToMerchants] = useState<number>(520000);
  const [fabricCollected] = useState<number>(400000);
  const [yarnSoldToWeavers, setYarnSoldToWeavers] = useState<number>(60000);
  const [yarnCollected] = useState<number>(60000);

  const [yarnBoughtSuppliers, setYarnBoughtSuppliers] = useState<number>(210000);
  const [weaverSettlementsPaid, setWeaverSettlementsPaid] = useState<number>(190000);
  const [fabricBoughtWeavers, setFabricBoughtWeavers] = useState<number>(40000);

  // Dynamic lists for liabilities and receivables
  const [weaversOwed, setWeaversOwed] = useState<Array<{ name: string; meta: string; amount: string }>>([
    { name: "Weaver 01", meta: "2 zigs ready to settle", amount: "14,200 ETB" },
    { name: "Weaver 02", meta: "1 zig ready to settle", amount: "8,600 ETB" },
    { name: "Weaver 03", meta: "Unpaid purchase", amount: "3,400 ETB" },
  ]);

  const [merchantsOwed, setMerchantsOwed] = useState<Array<{ name: string; amount: string }>>([
    { name: "Merchant 1", amount: "55,000 ETB" },
    { name: "Merchant 2", amount: "41,000 ETB" },
  ]);

  // Statements list state (when expanded)
  const [showHisabList, setShowHisabList] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch live commercial summary
    reportService
      .getCommercialSummary()
      .then((data) => {
        if (data) {
          if (data.fabricSalesRevenue || data.yarnSalesRevenue) {
            setFabricSoldToMerchants(data.fabricSalesRevenue);
            setYarnSoldToWeavers(data.yarnSalesRevenue);
            setRevenueBilled(data.fabricSalesRevenue + data.yarnSalesRevenue);
          }
          if (data.yarnProcurementExpense || data.weaverSettlementsExpense || data.fabricPurchasesExpense) {
            setYarnBoughtSuppliers(data.yarnProcurementExpense);
            setWeaverSettlementsPaid(data.weaverSettlementsExpense);
            setFabricBoughtWeavers(data.fabricPurchasesExpense);
            setExpenses(data.yarnProcurementExpense + data.weaverSettlementsExpense + data.fabricPurchasesExpense);
          }
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
            setWeaversOwed(
              balances.slice(0, 3).map((w) => ({
                name: w.fullName,
                meta: `${w.activeWorkOrdersCount || 1} zigs in progress`,
                amount: `${Math.round(w.estimatedPendingPayout || 4500).toLocaleString()} ETB`,
              }))
            );
          }
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
          if (mapped.length > 0) {
            setMerchantsOwed(mapped.slice(0, 5));
          } else {
            setMerchantsOwed(
              balances.slice(0, 2).map((m: any) => ({
                name: m.fullName || m.username || "Merchant",
                amount: `${Math.round(m.totalReceivableBalance || 0).toLocaleString()} ETB`,
              }))
            );
          }
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
      {/* Header */}
      <h1 className="stock-page-title">
        Reports <span className="title-amharic">· ሪፖርቶች</span>
      </h1>

      {/* Period Filter Chips */}
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

      {/* Top 3 Metric Cards */}
      <div className="reports-kpi-grid">
        <div className="card reports-kpi-card">
          <span className="reports-kpi-label">Revenue (billed)</span>
          <div className="reports-kpi-num">{revenueBilled.toLocaleString()}</div>
          <span className="reports-kpi-sub">ETB</span>
        </div>

        <div className="card reports-kpi-card">
          <span className="reports-kpi-label">Expenses</span>
          <div className="reports-kpi-num">{expenses.toLocaleString()}</div>
          <span className="reports-kpi-sub">ETB</span>
        </div>

        <div className="card reports-kpi-card">
          <span className="reports-kpi-label">Net operating profit</span>
          <div className="reports-kpi-num text-profit-rust">
            {netOperatingProfit.toLocaleString()}
          </div>
          <span className="reports-kpi-sub">ETB · revenue minus expenses</span>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="reports-main-layout">
        {/* Left Column */}
        <div className="reports-left-col">
          {/* Revenue & Expenses Detail Card */}
          <div className="card reports-breakdown-card">
            <div className="breakdown-columns-grid">
              {/* Revenue column */}
              <div className="breakdown-col">
                <h3 className="breakdown-col-title">Revenue</h3>
                <div className="breakdown-row">
                  <div className="breakdown-row-left">
                    <span className="breakdown-row-label">Fabric sold to merchants</span>
                    <span className="breakdown-row-sub">
                      collected {fabricCollected.toLocaleString()}
                    </span>
                  </div>
                  <span className="breakdown-row-val">{fabricSoldToMerchants.toLocaleString()}</span>
                </div>
                <div className="breakdown-row">
                  <div className="breakdown-row-left">
                    <span className="breakdown-row-label">Yarn sold to weavers</span>
                    <span className="breakdown-row-sub">
                      collected {yarnCollected.toLocaleString()}
                    </span>
                  </div>
                  <span className="breakdown-row-val">{yarnSoldToWeavers.toLocaleString()}</span>
                </div>
              </div>

              {/* Expenses column */}
              <div className="breakdown-col">
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
            <div className="reports-callout-warning">
              <span className="callout-icon">ⓘ</span>
              <p className="callout-text">
                <strong>How these are counted:</strong> sales and weaver purchases by the amount
                billed, settlements only once paid. Please confirm this basis with your accountant
                before using it for the General Assembly.
              </p>
            </div>
          </div>

          {/* HISAB settlement statements card */}
          <div className="card hisab-statements-card">
            <div className="hisab-statements-header">
              <div>
                <h3 className="hisab-statements-title">HISAB settlement statements</h3>
                <p className="hisab-statements-sub">
                  Print or download a statement for each payment
                </p>
              </div>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setShowHisabList(!showHisabList)}
              >
                {showHisabList ? "Close ✕" : "Open >"}
              </button>
            </div>

            {/* Collapsible statement ledger table */}
            {showHisabList && (
              <div className="hisab-records-table-wrap">
                <table className="hisab-records-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Artisan Weaver</th>
                      <th>Payment Date</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "#64748B" }}>
                          No recorded payments found.
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 5).map((p) => (
                        <tr key={p.paymentId}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700 }}>#{p.paymentId}</td>
                          <td>{p.weaver?.fullName}</td>
                          <td>{formatDateDDMMYY(p.paymentDate)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {parseFloat(p.amount || "0").toLocaleString()} ETB
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              to={`/admin/reports/hisab/payment/${p.paymentId}?print=1`}
                              className="btn btn-primary btn-sm"
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
          <div className="card reports-owed-card">
            <div className="owed-card-header">
              <div className="owed-card-title-row">
                <h3 className="owed-card-title">Owed to weavers</h3>
                <span className="badge-pill-amber">{weaversOwed.length} weavers</span>
              </div>
              <p className="owed-card-sub">
                Returned zigs not yet settled, and unpaid fabric purchases
              </p>
            </div>

            <div className="owed-list">
              {weaversOwed.map((w, idx) => (
                <div key={idx} className="owed-item">
                  <div className="owed-item-left">
                    <span className="owed-item-name">{w.name}</span>
                    <span className="owed-item-meta">{w.meta}</span>
                  </div>
                  <span className="owed-item-amount">{w.amount}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full-width"
              onClick={() => navigate("/admin/weavers")}
            >
              See all weavers
            </button>
          </div>

          {/* Card 2: Owed by merchants */}
          <div className="card reports-owed-card">
            <div className="owed-card-header">
              <div className="owed-card-title-row">
                <h3 className="owed-card-title">Owed by merchants</h3>
                <span className="badge-pill-amber">{merchantsOwed.length} merchants</span>
              </div>
              <p className="owed-card-sub">Unpaid fabric sales</p>
            </div>

            <div className="owed-list">
              {merchantsOwed.map((m, idx) => (
                <div key={idx} className="owed-item">
                  <span className="owed-item-name">{m.name}</span>
                  <span className="owed-item-amount">{m.amount}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full-width"
              onClick={() => navigate("/admin/transactions")}
            >
              See all merchants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
