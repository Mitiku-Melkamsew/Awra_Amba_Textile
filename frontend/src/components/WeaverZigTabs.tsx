import { useEffect, useState } from "react";
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

  useEffect(() => {
    setLoading(true);
    workOrdersApi
      .list({ weaverId: weaver.weaverId, status: activeTab })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [weaver.weaverId, activeTab]);

  const initials = weaver.firstName.charAt(0) + weaver.lastName.charAt(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, minHeight: 0 }}>
      {/* Profile banner */}
      <div className="profile-header">
        <div className="profile-identity">
          <div className="profile-avatar">{initials}</div>
          <div>
            <p className="profile-name">{weaver.firstName} {weaver.lastName}</p>
            <p className="profile-meta">
              #{weaver.weaverId}
              {weaver.phone && ` · ${weaver.phone}`}
              {weaver.bankAccountNumber && ` · ${weaver.bankAccountNumber}`}
            </p>
          </div>
        </div>
        {issueZigLink && (
          <Link to={issueZigLink} className="btn-primary">
            + Issue Zig
          </Link>
        )}
      </div>

      {/* Tab pills */}
      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? "tab-pill active" : "tab-pill"}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.amharic}</span>
            <span style={{ fontSize: 11.5, opacity: 0.8 }}>/ {tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <p className="muted" style={{ fontSize: 13 }}>Loading…</p>}
      {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          No work orders in this status.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="zig-grid" style={{ flex: 1, alignContent: "start" }}>
          {orders.map((order) => (
            <ZigCard key={order.zigId} order={order} to={`${zigLinkPrefix}/${order.zigId}`} />
          ))}
        </div>
      )}
    </div>
  );
}