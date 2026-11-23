import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { calculationsApi, type CommittedSettlementSummary } from "../api";
import type { PendingSettlementsSummary, ZigLedgerItem } from "../domain/models";
import { SettlementZigsTab } from "./settlement/SettlementZigsTab";
import { SettlementRunsTab } from "./settlement/SettlementRunsTab";

export function SettlementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "runs" ? "runs" : "zigs";

  // Data states
  const [pendingSummary, setPendingSummary] = useState<PendingSettlementsSummary | null>(null);
  const [zigs, setZigs] = useState<ZigLedgerItem[]>([]);
  const [zigsLoading, setZigsLoading] = useState(true);

  const [batches, setBatches] = useState<CommittedSettlementSummary[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [error, setError] = useState("");

  const handleTabChange = (tab: "zigs" | "runs") => {
    setSearchParams({ tab });
  };

  // Load summary and zigs ledger
  useEffect(() => {
    setZigsLoading(true);
    calculationsApi
      .pendingSummary()
      .then(setPendingSummary)
      .catch(() => {});

    calculationsApi
      .zigsLedger()
      .then((data) => {
        setZigs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load zigs ledger");
      })
      .finally(() => setZigsLoading(false));
  }, []);

  // Load history/batches when runs tab is selected
  useEffect(() => {
    if (currentTab === "runs") {
      setBatchesLoading(true);
      calculationsApi
        .settlementHistory()
        .then((res) => {
          setBatches(Array.isArray(res) ? res : []);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load settlement runs");
        })
        .finally(() => setBatchesLoading(false));
    }
  }, [currentTab]);

  // Derived counts for KPI cards
  const readyToSettleAmount = pendingSummary?.pendingLiability ?? 
    zigs.filter((z) => z.status === "returned").reduce((acc, z) => {
      const gross = z.fabric?.grossFabricValue ?? 0;
      const deductions = z.fabric?.deductionAmount ?? 0;
      const yarn = z.yarn?.totalCost ?? 0;
      const net = (z as any).netPayable !== undefined ? (z as any).netPayable : (gross - deductions - yarn);
      return acc + (net > 0 ? net : 0);
    }, 0);

  const returnedZigsCount = pendingSummary?.unsettledZigCount ?? 
    zigs.filter((z) => z.status === "returned").length;

  const ongoingZigsCount = zigs.filter((z) => z.status === "assigned" || z.status === "in_progress").length;

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
          Settlement · ሂሳብ
        </h1>

        <Link
          to="/admin/settlement/new"
          className="btn btn-primary"
          style={{
            background: "var(--brand, #c2410c)",
            borderColor: "var(--brand, #c2410c)",
            color: "#ffffff",
            fontWeight: 600,
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>+</span> Start settlement run
        </Link>
      </div>

      {/* ── Segmented Control Tabs (Zigs / Runs) ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="settlement-segmented-tabs">
          <button
            type="button"
            onClick={() => handleTabChange("zigs")}
            className={`settlement-segmented-tab ${currentTab === "zigs" ? "active" : ""}`}
          >
            Zigs
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("runs")}
            className={`settlement-segmented-tab ${currentTab === "runs" ? "active" : ""}`}
          >
            Runs
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Tab Views ── */}
      {currentTab === "zigs" ? (
        <SettlementZigsTab
          data={zigs}
          loading={zigsLoading}
          readyToSettleAmount={readyToSettleAmount}
          returnedZigsCount={returnedZigsCount}
          ongoingZigsCount={ongoingZigsCount}
        />
      ) : (
        <SettlementRunsTab batches={batches} loading={batchesLoading} />
      )}
    </div>
  );
}

export default SettlementPage;
