import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { workOrdersApi } from "../api";
import type { Weaver, WorkOrder } from "../api";
import { ZigCard } from "./ZigCard";

const TABS = [
  { key: "assigned", label: "ተመድቧል", sub: "Assigned" },
  { key: "in_progress", label: "በሂደት", sub: "In Progress" },
  { key: "returned", label: "ተመለሰ", sub: "Returned" },
  { key: "reconciled", label: "ተሰማረ", sub: "Reconciled" },
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

  return (
    <div className="weaver-profile">
      <header className="profile-header">
        <div>
          <h2>
            {weaver.firstName} {weaver.lastName}
          </h2>
          <p className="muted">
            #{weaver.weaverId}
            {weaver.phone && ` · ${weaver.phone}`}
            {weaver.bankAccountNumber && ` · ${weaver.bankAccountNumber}`}
          </p>
        </div>
        {issueZigLink && (
          <Link to={issueZigLink} className="btn-sm">
            + አዲስ ዝግ
          </Link>
        )}
      </header>

      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.label}</span>
            <small>{tab.sub}</small>
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="muted empty-state">No work orders in this tab.</p>
      )}
      <div className="zig-grid">
        {orders.map((order) => (
          <ZigCard key={order.zigId} order={order} to={`${zigLinkPrefix}/${order.zigId}`} />
        ))}
      </div>
    </div>
  );
}