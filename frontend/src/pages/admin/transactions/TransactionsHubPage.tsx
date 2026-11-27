import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function counterpartyName(txn: any): string {
  if (txn.merchant) {
    return txn.merchant.companyName || txn.merchant.fullName || txn.merchant.phone || `Merchant #${txn.merchant.userId}`;
  }
  if (txn.weaver) {
    return txn.weaver.fullName || `Weaver #${txn.weaver.userId}`;
  }
  if (txn.supplier) {
    return txn.supplier.name || "Supplier";
  }
  return "—";
}

function itemsSubtitle(txn: any): string {
  const lines = txn.lines ?? [];
  if (lines.length === 0) return "—";
  if (lines.length === 1) {
    const l = lines[0];
    const name =
      l.fabricVariant?.fabric?.name ||
      l.fabricVariant?.sku ||
      l.yarnVariant?.yarn?.name ||
      l.yarnVariant?.sku ||
      l.description ||
      "Item";
    return `${name} · ${l.quantity} pcs`;
  }
  const totalQty = lines.reduce((s: number, l: any) => s + Number(l.quantity || 0), 0);
  return `${lines.length} items · ${totalQty} pcs`;
}

function getTypeBadge(type: string) {
  const norm = String(type || "").toLowerCase();
  if (norm.includes("fabric") && (norm.includes("sale") || norm.includes("sell"))) {
    return { label: "Sell fabric", bg: "#e0f2fe", text: "#0369a1" };
  }
  if (norm.includes("fabric") && (norm.includes("purchase") || norm.includes("buy"))) {
    return { label: "Buy fabric", bg: "#f0fdf4", text: "#166534" };
  }
  if (norm.includes("yarn") && (norm.includes("sale") || norm.includes("sell"))) {
    return { label: "Sell yarn", bg: "#eff6ff", text: "#1d4ed8" };
  }
  if (norm.includes("yarn") && (norm.includes("purchase") || norm.includes("buy"))) {
    return { label: "Buy yarn", bg: "#f1f5f9", text: "#334155" };
  }
  return { label: type || "Transaction", bg: "#f1f5f9", text: "#475569" };
}

function matchesCategory(t: any, tab: string): boolean {
  if (tab === "all") return true;

  const type = String(t.type || "").toLowerCase();

  if (tab === "yarn_purchase") {
    // Yarn purchases (procurement from suppliers)
    if (type === "yarn_purchase" || type === "yarn_purchases") return true;
    if (type.includes("yarn") && (type.includes("purchase") || type.includes("buy"))) return true;
    if (t.supplier && (type.includes("yarn") || t.lines?.some((l: any) => l.yarnVariantId || l.yarnVariant))) return true;
    return false;
  }

  if (tab === "fabric_purchase_from_weaver") {
    // Fabric purchases (from weavers)
    if (type === "fabric_purchase_from_weaver" || type === "fabric_purchase" || type === "fabric_purchases") return true;
    if (type.includes("fabric") && (type.includes("purchase") || type.includes("buy"))) return true;
    if (t.weaver && (type.includes("buy") || type.includes("purchase"))) return true;
    return false;
  }

  if (tab === "fabric_sale_to_merchant") {
    // Fabric sales (to merchants)
    if (type === "fabric_sale_to_merchant" || type === "fabric_sale" || type === "fabric_sales") return true;
    if (type.includes("fabric") && (type.includes("sale") || type.includes("sell"))) return true;
    if (t.merchant && (type.includes("fabric") || t.lines?.some((l: any) => l.fabricVariantId || l.fabricVariant))) return true;
    return false;
  }

  if (tab === "yarn_sale_to_weaver") {
    // Yarn sales (to weavers)
    if (type === "yarn_sale_to_weaver" || type === "yarn_sale" || type === "yarn_sales") return true;
    if (type.includes("yarn") && (type.includes("sale") || type.includes("sell"))) return true;
    if (t.weaver && (type.includes("sale") || type.includes("sell"))) return true;
    return false;
  }

  return type === tab.toLowerCase();
}

function matchesStatus(t: any, statusFilter: string): boolean {
  if (statusFilter === "all") return true;
  const status = String(t.status || "").toLowerCase();
  if (statusFilter === "partly_paid" || statusFilter === "partially_paid") {
    return status === "partly_paid" || status === "partially_paid";
  }
  return status === statusFilter.toLowerCase();
}

export function TransactionsHubPage() {
  const [transactions, setTransactions] = useState<CommercialTransaction[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Selected transaction ID for right side payment pane
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  // Payment form state in right pane
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNotes] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await transactionsApi.list();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Filtered transactions matching all active criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      const id = String(t.transactionId ?? "");
      const okType = matchesCategory(t, typeFilter);
      const okStatus = matchesStatus(t, statusFilter);
      const q = search.toLowerCase().trim();
      const typeStr = t.type ? TXN_TYPE_LABELS[t.type] || t.type : "";
      const okSearch =
        !q ||
        id.toLowerCase().includes(q) ||
        counterpartyName(t).toLowerCase().includes(q) ||
        typeStr.toLowerCase().includes(q) ||
        itemsSubtitle(t).toLowerCase().includes(q);
      return okType && okStatus && okSearch;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  // Keep selectedTxn 100% in sync with filteredTransactions
  const selectedTxn = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    if (!selectedTxnId) return filteredTransactions[0];
    const found = filteredTransactions.find(
      (t: any) => String(t.transactionId) === String(selectedTxnId)
    );
    return found || filteredTransactions[0];
  }, [filteredTransactions, selectedTxnId]);

  // Whenever selectedTxn updates or list re-filters, sync selectedTxnId
  useEffect(() => {
    if (selectedTxn) {
      const canonicalId = String(selectedTxn.transactionId);
      if (selectedTxnId !== canonicalId) {
        setSelectedTxnId(canonicalId);
      }
    } else {
      setSelectedTxnId(null);
    }
  }, [selectedTxn, selectedTxnId]);

  // When selected transaction changes, prefill balance
  useEffect(() => {
    setConfirmCancel(false);
    if (selectedTxn) {
      const total = parseFloat(String(selectedTxn.totalAmount || "0"));
      const paid = parseFloat(String(selectedTxn.amountPaid ?? "0"));
      const bal = Math.max(0, total - paid);
      setPayAmount(bal > 0 ? String(bal) : "");
      setPayError("");
    } else {
      setPayAmount("");
      setPayError("");
    }
  }, [selectedTxn]);

  const selectedTotal = selectedTxn ? parseFloat(String(selectedTxn.totalAmount || "0")) : 0;
  const selectedPaid = selectedTxn ? parseFloat(String(selectedTxn.amountPaid ?? "0")) : 0;
  const selectedBalance = Math.max(0, selectedTotal - selectedPaid);
  const selectedPercent = selectedTotal > 0 ? Math.min(100, Math.round((selectedPaid / selectedTotal) * 100)) : (selectedPaid > 0 ? 100 : 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid positive payment amount.");
      return;
    }

    setPayBusy(true);
    setPayError("");
    try {
      await transactionsApi.addPayment(String(selectedTxn.transactionId), {
        amount: amt,
        paymentMethod: payMethod,
        notes: payNotes.trim() || undefined,
      });

      setSuccessMessage(
        `Payment of ${amt.toLocaleString()} ETB successfully recorded for #${selectedTxn.transactionId}.`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      await loadTransactions();
    } catch (err: any) {
      setPayError(err.message || "Failed to record payment. Please try again.");
    } finally {
      setPayBusy(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!selectedTxn) return;
    setCancelBusy(true);
    setPayError("");
    try {
      await transactionsApi.cancel(String(selectedTxn.transactionId));
      setConfirmCancel(false);
      setSuccessMessage(`Transaction #${selectedTxn.transactionId} has been cancelled.`);
      setTimeout(() => setSuccessMessage(""), 5000);
      await loadTransactions();
    } catch (err: any) {
      setPayError(err.message || "Failed to cancel transaction.");
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem 3rem" }}>
      {/* Overline & Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
            ግብይት · TRANSACTIONS
          </div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Transactions
          </h1>
        </div>
        <Link
          to="/admin/transactions/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#c2410c",
            color: "#ffffff",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
            boxShadow: "0 1px 3px rgba(194, 65, 12, 0.2)",
            transition: "background 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#9a3412")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#c2410c")}
        >
          <span>+</span> New transaction
        </Link>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
        {[
          { id: "all", label: "All" },
          { id: "yarn_purchase", label: "Yarn purchases" },
          { id: "fabric_purchase_from_weaver", label: "Fabric purchases" },
          { id: "fabric_sale_to_merchant", label: "Fabric sales" },
          { id: "yarn_sale_to_weaver", label: "Yarn sales" },
        ].map((tab) => {
          const isActive = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid #c2410c" : "2px solid transparent",
                color: isActive ? "#c2410c" : "#64748b",
                fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                padding: "0.5rem 0.25rem 0.75rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {successMessage && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          background: "#ffffff",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by ID, name or item"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {[
            { id: "all", label: "All" },
            { id: "unpaid", label: "Unpaid" },
            { id: "partly_paid", label: "Partly paid" },
            { id: "paid", label: "Paid" },
            { id: "cancelled", label: "Cancelled" },
          ].map((st) => {
            const isSelected = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  background: isSelected ? "#059669" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  border: isSelected ? "1px solid #059669" : "1px solid #e2e8f0",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Transactions Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12.5px" }}>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Transaction</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Counterparty</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Total</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Balance due</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t: any) => {
                  const isSelected = selectedTxn ? String(selectedTxn.transactionId) === String(t.transactionId) : false;
                  const typeBadge = getTypeBadge(t.type);
                  const total = parseFloat(String(t.totalAmount || "0"));
                  const paid = parseFloat(String(t.amountPaid ?? "0"));
                  const balance = Math.max(0, total - paid);

                  return (
                    <tr
                      key={t.transactionId}
                      onClick={() => setSelectedTxnId(String(t.transactionId))}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: isSelected ? "#fffdf5" : "transparent",
                        borderLeft: isSelected ? "3px solid #c2410c" : "3px solid transparent",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: "0.85rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>
                        {formatDateDDMMYY(t.transactionDate || t.createdAt)}
                      </td>

                      {/* Transaction ID & Type + Subtitle */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                          <Link
                            to={`/admin/transactions/${t.transactionId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontWeight: 700, color: "#0f172a", textDecoration: "none" }}
                            onMouseOver={(e) => (e.currentTarget.style.color = "#c2410c")}
                            onMouseOut={(e) => (e.currentTarget.style.color = "#0f172a")}
                          >
                            [{t.transactionId}]
                          </Link>
                          <span
                            style={{
                              background: typeBadge.bg,
                              color: typeBadge.text,
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                            }}
                          >
                            {typeBadge.label}
                          </span>
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                          {itemsSubtitle(t)}
                        </div>
                      </td>

                      {/* Counterparty */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#334155" }}>
                        {counterpartyName(t)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                        {total > 0 ? `${total.toLocaleString()} ETB` : "—"}
                      </td>

                      {/* Balance due */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: balance > 0 ? "#c2410c" : "#059669" }}>
                        {total > 0 ? (balance > 0 ? balance.toLocaleString() : "0") : "—"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {t.status === "paid" ? (
                          <span style={{ background: "#dcfce7", color: "#166534", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            ✓ Paid
                          </span>
                        ) : t.status === "partly_paid" || t.status === "partially_paid" ? (
                          <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Partly paid
                          </span>
                        ) : t.status === "cancelled" ? (
                          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Cancelled
                          </span>
                        ) : t.status === "recorded" ? (
                          <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Recorded
                          </span>
                        ) : (
                          <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Unpaid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Record Payment Card */}
        <div
          style={{
            position: "sticky",
            top: "1.5rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            padding: "1.5rem",
          }}
        >
          {selectedTxn ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h3 style={{ margin: "0 0 0.25rem", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Record payment
                </h3>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  [{selectedTxn.transactionId}] · {counterpartyName(selectedTxn)}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    background: "#e2e8f0",
                    height: "8px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      background: "#059669",
                      height: "100%",
                      width: `${selectedPercent}%`,
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Metrics Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "13.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Total</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{selectedTotal.toLocaleString()} ETB</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Paid so far</span>
                    <span style={{ fontWeight: 600, color: "#059669" }}>{selectedPaid.toLocaleString()} ETB</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Balance</span>
                    <span style={{ fontWeight: 700, color: selectedBalance > 0 ? "#c2410c" : "#059669" }}>
                      {selectedBalance.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Note or Payment Form */}
              {selectedTxn.status === "cancelled" ? (
                <div style={{ padding: "1rem", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "13.5px", textAlign: "center" }}>
                  This transaction is cancelled. Payments cannot be added.
                </div>
              ) : selectedBalance <= 0 ? (
                <div style={{ padding: "1rem", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "13.5px", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>✓ Fully paid</div>
                  <Link
                    to={`/admin/transactions/${selectedTxn.transactionId}`}
                    style={{ color: "#c2410c", fontWeight: 600, textDecoration: "none", fontSize: "13px" }}
                  >
                    View transaction details →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {payError && (
                    <div style={{ color: "#b91c1c", fontSize: "12.5px", background: "#fee2e2", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                      {payError}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                        Amount (ETB)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Amount"
                        required
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                        Method
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          background: "#ffffff",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank transfer">Bank transfer</option>
                        <option value="Telebirr">Telebirr</option>
                        <option value="CBE Birr">CBE Birr</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={payBusy}
                    style={{
                      background: "#c2410c",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.7rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: payBusy ? "not-allowed" : "pointer",
                      boxShadow: "0 1px 2px rgba(194, 65, 12, 0.2)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      if (!payBusy) e.currentTarget.style.background = "#9a3412";
                    }}
                    onMouseOut={(e) => {
                      if (!payBusy) e.currentTarget.style.background = "#c2410c";
                    }}
                  >
                    {payBusy ? "Recording…" : "Record payment"}
                  </button>

                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                    Defaults to the full balance. You can pay less now and the rest later.
                  </div>
                </form>
              )}

              {/* Sidebar Footer: Full Details & Cancel */}
              <div className="txn-sidebar-footer">
                <Link
                  to={`/admin/transactions/${selectedTxn.transactionId}`}
                  className="btn btn-secondary btn-sm btn-full-width"
                >
                  See full details →
                </Link>

                {selectedTxn.status !== "cancelled" && (
                  confirmCancel ? (
                    <div className="txn-sidebar-cancel-row">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm txn-sidebar-cancel-btn"
                        onClick={() => setConfirmCancel(false)}
                        disabled={cancelBusy}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm txn-sidebar-cancel-btn"
                        onClick={handleCancelTransaction}
                        disabled={cancelBusy}
                      >
                        {cancelBusy ? "Cancelling…" : "Confirm cancel"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-full-width"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel transaction
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8", fontSize: "14px" }}>
              Select a transaction to record a payment or inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionsHubPage;
