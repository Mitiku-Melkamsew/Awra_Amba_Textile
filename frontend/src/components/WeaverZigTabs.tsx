import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { weaversApi, workOrdersApi } from "../api";
import type { Weaver, WorkOrder } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";
import { fabricVariantName } from "../utils/variantNames";

const FILTER_PILLS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "returned", label: "Returned" },
  { key: "reconciled", label: "Reconciled" },
  { key: "cancelled", label: "Cancelled" },
] as const;

interface WeaverZigTabsProps {
  weaver: Weaver;
  zigLinkPrefix: string;
  issueZigLink?: string;
  onWeaverUpdated?: () => void;
}

export function WeaverZigTabs({
  weaver,
  zigLinkPrefix,
  issueZigLink,
  onWeaverUpdated,
}: WeaverZigTabsProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_PILLS)[number]["key"]>("all");
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit details modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(weaver.fullName ?? "");
  const [editPhone, setEditPhone] = useState(weaver.phone ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const wid = weaver.userId;
  const isDeactivated = weaver.isActive === false || weaver.user?.isActive === false;

  useEffect(() => {
    setLoading(true);
    setError("");
    workOrdersApi
      .list({ weaverUserId: wid })
      .then((data) => {
        // Guarantee strict client-side filtering by weaver
        const strictlyMine = data.filter((o: any) => {
          const orderWid = o.weaverUserId ?? o.weaver?.userId;
          return Number(orderWid) === Number(wid);
        });
        setAllOrders(strictlyMine);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [wid]);

  const displayName =
    weaver.fullName ||
    `${weaver.firstName ?? ""} ${weaver.lastName ?? ""}`.trim() ||
    `Weaver #${wid}`;
  const initial = (displayName.trim()[0] || "W").toUpperCase();

  // Compute KPI metrics for the 3 cards (Image 3)
  const openCount = useMemo(
    () => allOrders.filter((o) => o.status === "assigned" || o.status === "in_progress").length,
    [allOrders],
  );
  const returnedCount = useMemo(
    () => allOrders.filter((o) => o.status === "returned").length,
    [allOrders],
  );
  const reconciledCount = useMemo(
    () => allOrders.filter((o) => o.status === "reconciled").length,
    [allOrders],
  );

  // Filter zigs according to selected pill
  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return allOrders;
    if (activeFilter === "open") {
      return allOrders.filter((o) => o.status === "assigned" || o.status === "in_progress");
    }
    if (activeFilter === "returned") {
      return allOrders.filter((o) => o.status === "returned");
    }
    if (activeFilter === "reconciled") {
      return allOrders.filter((o) => o.status === "reconciled");
    }
    if (activeFilter === "cancelled") {
      return allOrders.filter((o) => o.status === "cancelled");
    }
    return allOrders;
  }, [allOrders, activeFilter]);

  // Handle Edit Weaver save
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");
    try {
      if (!editFullName.trim()) {
        throw new Error("Weaver name cannot be empty");
      }
      await weaversApi.create({
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
      }); // or update if exists
      setIsEditOpen(false);
      if (onWeaverUpdated) onWeaverUpdated();
    } catch (err: any) {
      setEditError(err instanceof Error ? err.message : "Failed to update weaver");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          WEAVER PROFILE HEADER CARD (Image 3)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Left: Avatar + Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#ffedd5",
              color: "#9a3412",
              fontSize: "1.5rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {displayName}
              {isDeactivated && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    textTransform: "uppercase",
                  }}
                >
                  Deactivated
                </span>
              )}
            </h1>
            <p
              style={{
                margin: "0.35rem 0 0 0",
                fontSize: "0.85rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              ID #{wid} · {weaver.phone || "No phone"} · Bank [account]
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setEditFullName(weaver.fullName ?? "");
              setEditPhone(weaver.phone ?? "");
              setEditError("");
              setIsEditOpen(true);
            }}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.55rem 1.15rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Edit details
          </button>

          {issueZigLink && !isDeactivated && (
            <Link
              to={issueZigLink}
              style={{
                background: "var(--brand, #c2410c)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.55rem 1.25rem",
                fontSize: "0.88rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              + Issue new zig
            </Link>
          )}
        </div>
      </div>

      {/* Deactivated warning alert */}
      {isDeactivated && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#9f1239",
            fontSize: "13.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <span>
            <strong>Account Deactivated:</strong> This artisan account is inactive.
            Existing work orders and history remain viewable for reconciliation, but new zigs cannot be issued to this weaver.
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3 STAT KPI CARDS (Image 3)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Card 1: Open zigs */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
            Open zigs
          </div>
          <div
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            {loading ? "…" : openCount}
          </div>
        </div>

        {/* Card 2: Returned · ready to settle */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
            Returned · ready to settle
          </div>
          <div
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            {loading ? "…" : returnedCount}
          </div>
        </div>

        {/* Card 3: Reconciled */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
            Reconciled
          </div>
          <div
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#0f172a",
              marginTop: "0.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            {loading ? "…" : reconciledCount}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABS ROW: Zigs · ዝግ + Pills (Image 3)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginTop: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
          Zigs · ዝግ
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          {FILTER_PILLS.map((pill) => {
            const isActive = activeFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setActiveFilter(pill.key)}
                style={{
                  background: isActive ? "#ffffff" : "#f8fafc",
                  border: isActive ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                  color: isActive ? "#15803d" : "#475569",
                  borderRadius: "9999px",
                  padding: "0.35rem 0.9rem",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error indicators */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          ⏳ Loading work orders…
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "0.75rem",
            color: "#b91c1c",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ZIGS TABLE CARD (Image 3)
         ───────────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Table Header Row (Image 3) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(140px, 1fr) minmax(220px, 2fr) minmax(120px, 1fr) minmax(130px, 1fr) 40px",
              alignItems: "center",
              borderBottom: "1px solid #f1f5f9",
              padding: "0.85rem 1.5rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "capitalize",
            }}
          >
            <span>Zig</span>
            <span>Fabric</span>
            <span>Issued</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Empty state */}
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
              <div style={{ fontWeight: 600, color: "#475569" }}>
                No work orders {activeFilter !== "all" ? `with status "${activeFilter}"` : "yet"}
              </div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {issueZigLink && !isDeactivated
                  ? "Click '+ Issue new zig' above to assign new work."
                  : "Work orders will appear here once assigned."}
              </div>
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const fabricName = order.fabricVariant
                ? fabricVariantName(order.fabricVariant).split("-").join(" · ")
                : order.fabric?.name || "medebegna · biret · geberdin";

              const issuedDate = formatDateDDMMYY(order.dateIssued ?? order.assignedDate ?? new Date());

              return (
                <div
                  key={order.zigId}
                  onClick={() => navigate(`${zigLinkPrefix}/${order.zigId}`)}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(140px, 1fr) minmax(220px, 2fr) minmax(120px, 1fr) minmax(130px, 1fr) 40px",
                    alignItems: "center",
                    borderBottom: "1px solid #f8fafc",
                    padding: "0.95rem 1.5rem",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  {/* Column 1: Zig ID */}
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                    {order.zigId}
                  </span>

                  {/* Column 2: Fabric */}
                  <span style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 500 }}>
                    {fabricName}
                  </span>

                  {/* Column 3: Issued */}
                  <span style={{ color: "#64748b", fontSize: "0.88rem" }}>
                    {issuedDate}
                  </span>

                  {/* Column 4: Status Badge (Image 3) */}
                  <div>
                    {order.status === "in_progress" && (
                      <span
                        style={{
                          background: "#e0f2fe",
                          color: "#0369a1",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        In progress
                      </span>
                    )}
                    {order.status === "assigned" && (
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        Assigned
                      </span>
                    )}
                    {order.status === "returned" && (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#b45309",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        Returned
                      </span>
                    )}
                    {order.status === "reconciled" && (
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        ✓ Reconciled
                      </span>
                    )}
                    {order.status === "cancelled" && (
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        Cancelled
                      </span>
                    )}
                  </div>

                  {/* Column 5: Chevron */}
                  <span style={{ color: "#94a3b8", fontSize: "1.1rem", textAlign: "right" }}>
                    ›
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Edit Weaver Details
         ───────────────────────────────────────────────────────────── */}
      {isEditOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 440,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Edit Weaver Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Full name / ሙሉ ስም
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Phone number / ስልክ
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {editError && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    marginBottom: "1rem",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                  }}
                >
                  {editError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: "0.55rem 1.35rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--brand, #c2410c)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeaverZigTabs;
