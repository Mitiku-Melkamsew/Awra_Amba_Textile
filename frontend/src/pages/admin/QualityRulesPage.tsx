import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { catalogApi, type QualityRuleRow } from "../../api";

const DEFAULT_QUALITY_RULES: QualityRuleRow[] = [
  {
    qualityRuleId: 1,
    factor: "weight",
    unit: "g",
    deductionPerUnit: 10,
    isActive: true,
  },
];

export function QualityRulesPage() {
  const [rules, setRules] = useState<QualityRuleRow[]>(DEFAULT_QUALITY_RULES);
  const [loading, setLoading] = useState(true);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(1);
  const [showClosed, setShowClosed] = useState(false);

  // Edit panel state
  const [editDeduction, setEditDeduction] = useState<string>("12");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal for + Add rule
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFactor, setNewFactor] = useState("weight");
  const [newUnit, setNewUnit] = useState("g");
  const [newDeduction, setNewDeduction] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await catalogApi.qualityRules();
      if (Array.isArray(data) && data.length > 0) {
        setRules(data);
        const active = data.find((r) => r.isActive !== false) || data[0];
        setSelectedRuleId(active.qualityRuleId);
        setEditDeduction(String(active.deductionPerUnit));
      } else {
        setRules(DEFAULT_QUALITY_RULES);
        setSelectedRuleId(1);
        setEditDeduction("10");
      }
    } catch {
      // Graceful fallback to default rules
      setRules(DEFAULT_QUALITY_RULES);
      setSelectedRuleId(1);
      setEditDeduction("10");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const selectedRule = useMemo(() => {
    return rules.find((r) => r.qualityRuleId === selectedRuleId) || rules[0] || null;
  }, [rules, selectedRuleId]);

  function handleSelectRule(rule: QualityRuleRow) {
    setSelectedRuleId(rule.qualityRuleId);
    setEditDeduction(String(rule.deductionPerUnit));
    setStatusMessage("");
    setErrorMessage("");
  }

  async function handleSaveChanges(e: FormEvent) {
    e.preventDefault();
    if (!selectedRule) return;
    const rateNum = parseFloat(editDeduction);
    if (isNaN(rateNum) || rateNum < 0) {
      setErrorMessage("Please enter a valid deduction rate.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateQualityRule(selectedRule.qualityRuleId, {
        unit: selectedRule.unit,
        deductionPerUnit: rateNum,
      });

      setStatusMessage("Quality rule changes saved successfully.");
      setRules((prev) =>
        prev.map((r) =>
          r.qualityRuleId === selectedRule.qualityRuleId
            ? { ...r, deductionPerUnit: rateNum }
            : r
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update quality rule");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddRule(e: FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(newDeduction);
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMessage("Please enter a valid positive deduction rate.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const created = await catalogApi.createQualityRule({
        factor: newFactor,
        unit: newUnit,
        deductionPerUnit: rateNum,
      });

      setShowAddModal(false);
      setNewDeduction("");
      setStatusMessage("New quality rule added.");
      await loadRules();
      if (created && (created as any).qualityRuleId) {
        setSelectedRuleId((created as any).qualityRuleId);
        setEditDeduction(String(rateNum));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create quality rule");
    } finally {
      setIsCreating(false);
    }
  }

  const displayedRules = useMemo(() => {
    if (showClosed) return rules;
    return rules.filter((r) => r.isActive !== false);
  }, [rules, showClosed]);

  const calcRate = parseFloat(editDeduction) || 0;
  const exampleDeduction = (1 * calcRate * 42).toLocaleString();

  return (
    <div className="page" style={{ maxWidth: "100%", width: "100%" }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 4px",
              display: "flex",
              alignItems: "baseline",
              gap: "0.5rem",
            }}
          >
            Quality deduction rules <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "20px" }}>· ጥራት</span>
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
            Deducted when a fabric's average weight is below its standard
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: "#C2410C",
                cursor: "pointer",
              }}
            />
            Show closed rules
          </label>

          <button
            type="button"
            className="btn-primary-rust"
            onClick={() => {
              setShowAddModal(true);
              setNewDeduction("");
              setErrorMessage("");
            }}
          >
            + Add rule
          </button>
        </div>
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
      <div className="rules-master-detail-grid">
        {/* Left Table */}
        <div className="prices-table-container">
          <div className="prices-table-card">
            <table className="prices-table">
              <thead>
                <tr>
                  <th style={{ width: "32%" }}>Factor</th>
                  <th style={{ width: "30%" }}>Deduction</th>
                  <th style={{ width: "12%" }}>Unit</th>
                  <th style={{ width: "14%" }}>Status</th>
                  <th style={{ width: "12%", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && rules.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                      Loading quality rules…
                    </td>
                  </tr>
                ) : displayedRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                      No quality rules found.
                    </td>
                  </tr>
                ) : (
                  displayedRules.map((rule) => {
                    const isSelected = selectedRule?.qualityRuleId === rule.qualityRuleId;
                    const factorLabel =
                      rule.factor.toLowerCase() === "weight"
                        ? "Weight · ክብደት"
                        : rule.factor.toLowerCase() === "length"
                        ? "Length · ርዝመት"
                        : rule.factor.toLowerCase() === "width"
                        ? "Width · ስፋት"
                        : rule.factor;

                    return (
                      <tr
                        key={rule.qualityRuleId}
                        className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                        onClick={() => handleSelectRule(rule)}
                      >
                        <td>
                          <span className="price-item-name">{factorLabel}</span>
                        </td>
                        <td style={{ fontSize: "13.5px", color: "#111827", fontWeight: 500 }}>
                          <strong>{Number(rule.deductionPerUnit)} ETB</strong> per {rule.unit === "g" ? "gram short" : `${rule.unit} short`}
                        </td>
                        <td style={{ fontSize: "13.5px", color: "#64748B" }}>
                          {rule.unit}
                        </td>
                        <td>
                          {rule.isActive !== false ? (
                            <span className="status-pill-green">✓ Active</span>
                          ) : (
                            <span className="status-pill-gray">Closed</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-secondary-white btn-sm"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "12.5px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRule(rule);
                            }}
                          >
                            <span style={{ fontSize: "12px", opacity: 0.8 }}>✏️</span> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Edit Panel */}
        {selectedRule && (
          <div className="edit-detail-panel">
            <div className="detail-panel-header">
              <div>
                <h3 className="detail-panel-title">
                  Edit rule · {selectedRule.factor.charAt(0).toUpperCase() + selectedRule.factor.slice(1)}
                </h3>
                <p className="detail-panel-sub">
                  Deduction per piece, for each gram below the fabric's standard
                </p>
              </div>
              <button
                type="button"
                className="detail-close-btn"
                title="Close"
                onClick={() => setSelectedRuleId(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChanges}>
              <div className="field-label">
                Factor
                <input
                  type="text"
                  value={selectedRule.factor.charAt(0).toUpperCase() + selectedRule.factor.slice(1)}
                  readOnly
                  disabled
                  className="input-field input-read-only"
                />
              </div>

              <div className="field-label">
                Unit
                <input
                  type="text"
                  value={selectedRule.unit}
                  readOnly
                  disabled
                  className="input-field input-read-only"
                />
              </div>

              <div className="field-label">
                Deduction per gram (ETB)
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={editDeduction}
                  onChange={(e) => setEditDeduction(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setEditDeduction(String(selectedRule.deductionPerUnit))}
                >
                  Cancel
                </button>
              </div>

              {/* Example calculation box */}
              <div className="example-calc-box">
                <strong>Example:</strong> 42 pieces, 1 g short → 1 × {calcRate} × 42 = <strong>{exampleDeduction} ETB</strong> deducted.
              </div>

              <p style={{ margin: 0, fontSize: "12px", color: "#64748B", lineHeight: 1.45 }}>
                Applies to settlements calculated from now on. Confirmed settlements keep their saved deductions.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* ── Add Quality Rule Modal ── */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add quality rule</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule}>
              <div className="field-label">
                Factor
                <select
                  value={newFactor}
                  onChange={(e) => setNewFactor(e.target.value)}
                  className="input-field"
                >
                  <option value="weight">Weight</option>
                </select>
                <span className="field-label-sub">
                  Length and width are not used in settlements yet.
                </span>
              </div>

              <div className="field-label">
                Unit
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="input-field input-read-only"
                  readOnly
                />
              </div>

              <div className="field-label">
                Deduction per gram (ETB)
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="e.g. 10"
                  value={newDeduction}
                  onChange={(e) => setNewDeduction(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              {/* Warning note */}
              <div className="warning-callout-box">
                <span style={{ fontSize: "14px" }}>ⓘ</span>
                <div>
                  Only one weight rule can be active. Adding one replaces the current rate.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={isCreating}
                >
                  {isCreating ? "Adding…" : "Add rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QualityRulesPage;