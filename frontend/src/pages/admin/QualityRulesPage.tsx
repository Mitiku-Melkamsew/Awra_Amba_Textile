import { useQualityRulesManager } from "./quality/useQualityRulesManager";
import { QualityRulesTable } from "./quality/QualityRulesTable";
import { QualityRuleEditDrawer } from "./quality/QualityRuleEditDrawer";
import { AddQualityRuleModal } from "./quality/AddQualityRuleModal";

export function QualityRulesPage() {
  const {
    displayedRules,
    loading,
    selectedRule,
    setSelectedRuleId,
    showClosed,
    setShowClosed,
    editDeduction,
    setEditDeduction,
    isSaving,
    statusMessage,
    errorMessage,
    showAddModal,
    setShowAddModal,
    newFactor,
    setNewFactor,
    newUnit,
    setNewUnit,
    newDeduction,
    setNewDeduction,
    isCreating,
    handleSelectRule,
    handleSaveChanges,
    handleAddRule,
  } = useQualityRulesManager();

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title">
            Quality deduction rules <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "20px" }}>· ጥራት</span>
          </h1>
          <p className="page-subtitle">
            Deducted when a fabric's average weight is below its standard
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowAddModal(true);
            setNewDeduction("");
          }}
        >
          + Add rule
        </button>
      </div>

      {/* ── Controls Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "0.75rem",
          maxWidth: selectedRule ? "calc(100% - 364px)" : "100%",
        }}
      >
        <label className="checkbox-filter-label">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="styled-checkbox"
          />
          Show closed rules
        </label>
      </div>

      {statusMessage && (
        <div className="success-msg" style={{ marginBottom: "1rem" }}>
          <span>✅</span> {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* ── Master-Detail Grid ── */}
      <div className={`master-detail ${selectedRule ? "" : "no-panel"}`}>
        <QualityRulesTable
          rules={displayedRules}
          loading={loading}
          selectedRule={selectedRule}
          onSelectRule={handleSelectRule}
        />

        {selectedRule && (
          <QualityRuleEditDrawer
            rule={selectedRule}
            editDeduction={editDeduction}
            setEditDeduction={setEditDeduction}
            isSaving={isSaving}
            onSave={handleSaveChanges}
            onClose={() => setSelectedRuleId(null)}
          />
        )}
      </div>

      {/* ── Add Rule Modal ── */}
      <AddQualityRuleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRule}
        newFactor={newFactor}
        setNewFactor={setNewFactor}
        newUnit={newUnit}
        setNewUnit={setNewUnit}
        newDeduction={newDeduction}
        setNewDeduction={setNewDeduction}
        isCreating={isCreating}
      />
    </div>
  );
}

export default QualityRulesPage;
