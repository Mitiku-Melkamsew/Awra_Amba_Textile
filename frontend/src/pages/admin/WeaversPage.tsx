import { useWeaversManager } from "./weavers/useWeaversManager";
import { WeaverRosterToolbar } from "./weavers/WeaverRosterToolbar";
import { WeaverRosterTable } from "./weavers/WeaverRosterTable";
import { AddWeaverModal } from "./weavers/AddWeaverModal";
import { WeaverRatesTransparency } from "../../components/WeaverRatesTransparency";
import { WeaverWageCalculator } from "../../components/WeaverWageCalculator";

export function WeaversPage() {
  const {
    tab,
    handleTabChange,
    weavers,
    search,
    setSearch,
    sort,
    setSort,
    statusFilter,
    setStatusFilter,
    showAdd,
    setShowAdd,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    bankAccount,
    setBankAccount,
    error,
    addError,
    setAddError,
    saving,
    handleCreate,
  } = useWeaversManager();

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "1.25rem" }}>
        <div>
          <p className="eyebrow">ሸማኔዎች · WEAVERS</p>
          <h1 className="page-title">Weavers</h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowAdd(true);
            setAddError("");
          }}
        >
          + Add weaver
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="tab-bar">
        <button
          type="button"
          onClick={() => handleTabChange("roster")}
          className={`tab-pill ${tab === "roster" ? "active" : ""}`}
        >
          Artisans Roster
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("rates")}
          className={`tab-pill ${tab === "rates" ? "active" : ""}`}
        >
          Piece Rates & Transparency
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("calculator")}
          className={`tab-pill ${tab === "calculator" ? "active" : ""}`}
        >
          Wage & Deduction Calculator
        </button>
      </div>

      {/* Tab 2: Rates & Transparency */}
      {tab === "rates" && <WeaverRatesTransparency />}

      {/* Tab 3: Wage & Deduction Calculator */}
      {tab === "calculator" && <WeaverWageCalculator />}

      {/* Tab 1: Artisans Roster */}
      {tab === "roster" && (
        <>
          <WeaverRosterToolbar
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            count={weavers.length}
          />

          {error && (
            <div className="error-msg" style={{ marginBottom: "1rem" }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <WeaverRosterTable
            weavers={weavers}
            sort={sort}
            search={search}
          />
        </>
      )}

      {/* ── Add Weaver Modal ── */}
      <AddWeaverModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreate}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        phone={phone}
        setPhone={setPhone}
        bankAccount={bankAccount}
        setBankAccount={setBankAccount}
        addError={addError}
        saving={saving}
      />
    </div>
  );
}

export default WeaversPage;
