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
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">
            Quality deduction rules <span className="prices-title-amharic">· ጥራት</span>
          </h1>
          <p className="page-subtitle">
            Deducted when returned fabric measurements fall below standard or have recorded defects
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
      <div className="quality-controls-row">
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
        <div className="success-msg mb-4">
          <span>✅</span> {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="error-msg mb-4">
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
