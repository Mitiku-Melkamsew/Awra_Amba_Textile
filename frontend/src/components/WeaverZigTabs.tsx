import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { workOrdersApi } from "../api";
import type { Weaver, WorkOrder } from "../api";
import { ZigCard } from "./ZigCard";

const TABS = [
  { key: "in_progress", label: "In Progress", amharic: "በሂደት" },
  { key: "assigned",    label: "Assigned",    amharic: "ተመድቧል" },
  { key: "returned",    label: "Returned",    amharic: "ተመለሰ" },
  { key: "reconciled",  label: "Reconciled",  amharic: "ተሰማረ" },
] as const;

interface WeaverZigTabsProps {
  weaver: Weaver;
  zigLinkPrefix: string;
  issueZigLink?: string;
}

export function WeaverZigTabs({ weaver, zigLinkPrefix, issueZigLink }: WeaverZigTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("in_progress");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    workOrdersApi
      .list({ weaverId: weaver.weaverId, status: activeTab })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [weaver.weaverId, activeTab]);

  const initials = (weaver.firstName.charAt(0) + (weaver.lastName ? weaver.lastName.charAt(0) : "")).toUpperCase();

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.zigId.toLowerCase().includes(q) ||
        o.fabricVariant.product.name.toLowerCase().includes(q) ||
        (o.fabricVariant.warpColor?.name && o.fabricVariant.warpColor.name.toLowerCase().includes(q)) ||
        (o.fabricVariant.weftColor?.name && o.fabricVariant.weftColor.name.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      {/* Profile banner */}
      <div className="profile-header">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 className="profile-name">
                {weaver.firstName} {weaver.lastName}
              </h2>
              <span className="badge badge-green">Active Weaver</span>
            </div>
            <div className="profile-meta" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "4px" }}>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>ID: #{weaver.weaverId}</span>
              {weaver.phone && <span>📞 {weaver.phone}</span>}
              {weaver.bankAccountNumber && (
                <span style={{ background: "var(--bg-subtle)", padding: "0.1rem 0.5rem", borderRadius: "4px" }}>
                  🏦 Bank: {weaver.bankAccountNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        {issueZigLink && (
          <Link to={issueZigLink} className="btn-primary">
            <span>+</span> አዲስ ዝግ ስጥ / Issue Zig
          </Link>
        )}
      </div>

      {/* Tabs and search bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div className="tab-bar" role="tablist" style={{ margin: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? "tab-pill active" : "tab-pill"}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
              }}
            >
              <span>{tab.amharic}</span>
              <span style={{ fontSize: "11.5px", opacity: 0.85 }}>/ {tab.label}</span>
              {activeTab === tab.key && !loading && (
                <span className="tab-count">{orders.length}</span>
              )}
            </button>
          ))}
        </div>

        {orders.length > 3 && (
          <div style={{ minWidth: 200, flex: "0 1 240px" }}>
            <input
              type="text"
              placeholder="🔍 Search zigs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "36px", fontSize: "12.5px" }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="loading">
          <span>⏳</span> Loading work orders…
        </div>
      )}

      {error && (
        <div className="error-msg">
          <span>⚠️</span> {error}
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>
            {searchQuery ? "No work orders match your search." : `No work orders currently ${activeTab.replace("_", " ")}.`}
          </p>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {issueZigLink && activeTab === "assigned"
              ? "Click 'Issue Zig' above to assign fresh yarn and work to this weaver."
              : "Orders will automatically appear here as they transition through the weaving lifecycle."}
          </span>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="zig-grid">
          {filteredOrders.map((order) => (
            <ZigCard key={order.zigId} order={order} to={`${zigLinkPrefix}/${order.zigId}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WeaverZigTabs;
