import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, type QualityRuleRow } from "../../api";

export function QualityRulesPage() {
  const [rules, setRules] = useState<QualityRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Add rule state
  const [factor, setFactor] = useState("weight");
  const [unit, setUnit] = useState("g");
  const [deduction, setDeduction] = useState("");
  const [notes, setNotes] = useState("");

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editDeduction, setEditDeduction] = useState("");

  async function loadRules() {
    setLoading(true);
    setError("");
    try {
      const data = await catalogApi.qualityRules();
      setRules(data);
    } catch (err: any) {
      setError(err.message || "Failed to load quality rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function handleAddRule(e: FormEvent) {
    e.preventDefault();
    if (!factor || !unit || !deduction) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await catalogApi.createQualityRule({
        factor,
        unit,
        deductionPerUnit: Number(deduction),
        notes: notes || undefined,
      });
      setDeduction("");
      setNotes("");
      setMessage("Quality rule added successfully.");
      await loadRules();
    } catch (err: any) {
      setError(err.message || "Failed to create quality rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInlineEdit(id: number) {
    setError("");
    setMessage("");
    try {
      await catalogApi.updateQualityRule(id, {
        unit: editUnit,
        deductionPerUnit: Number(editDeduction),
      });
      setEditingId(null);
      setMessage("Quality rule updated successfully.");
      await loadRules();
    } catch (err: any) {
      setError(err.message || "Failed to update quality rule");
    }
  }

  async function handleToggleStatus(r: QualityRuleRow) {
    setError("");
    setMessage("");
    try {
      if (r.isActive) {
        await catalogApi.deactivateQualityRule(r.qualityRuleId);
        setMessage(`Quality rule deactivated.`);
      } else {
        await (catalogApi.updateQualityRule as any)(r.qualityRuleId, { isActive: true });
        setMessage(`Quality rule reactivated.`);
      }
      await loadRules();
    } catch (err: any) {
      setError(err.message || "Failed to update rule status");
    }
  }

  const q = search.toLowerCase().trim();

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (!showInactive && !r.isActive) return false;
      if (!q) return true;
      return (
        r.factor.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    });
  }, [rules, showInactive, q]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">የጥራት ህጎች / Quality Standards & Penalties</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Quality Deduction Rules</h1>
            <span className="badge badge-gray">{rules.length} Active Rules</span>
          </div>
          <p className="page-subtitle">
            Configure automatic deduction factors (e.g. weight deficit, length shortfall) applied during payroll settlement calculations.
          </p>
        </div>
      </div>

      {message && (
        <div className="success-msg">
          <span>✅</span> {message}
        </div>
      )}
      {error && (
        <div className="error-msg">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Add Rule Card */}
      <form className="card form inline-add-form" onSubmit={handleAddRule}>
        <p className="section-title">
          <span>⚖️</span> Add New Quality Rule / አዲስ የጥራት ህግ መዝግብ
        </p>
        <div className="form-row">
          <label>
            <span>Quality Factor / ሁኔታ</span>
            <select
              value={factor}
              onChange={(e) => {
                const val = e.target.value;
                setFactor(val);
                if (val === "weight") setUnit("g");
                else if (val === "length" || val === "width") setUnit("cm");
                else setUnit("piece");
              }}
              required
            >
              <option value="weight">Weight Deficit / የክብደት ጉድለት (g)</option>
              <option value="length">Length Shortfall / የቁመት ጉድለት (cm)</option>
              <option value="width">Width Shortfall / የስፋት ጉድለት (cm)</option>
              <option value="defect">Flaw / Defect Penalty (piece)</option>
            </select>
          </label>
          <label>
            <span>Measurement Unit / መለኪያ</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. g or cm"
              required
            />
          </label>
          <label>
            <span>Deduction Rate (ETB / unit) / ቅጣት</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              placeholder="e.g. 1.50"
              required
            />
          </label>
          <label>
            <span>Notes / ማብራሪያ (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Applied when fabric weight is below standard"
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "+ Record Quality Rule / መዝግብ"}
          </button>
        </div>
      </form>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginTop: "1rem" }}>
        <input
          className="search-input"
          placeholder="🔍 Filter quality rules by factor or unit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="checkbox-label" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show Inactive Rules / የተዘጉ ህጎችን አሳይ
        </label>
      </div>

      {/* Table */}
      <div className="card table-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading"><span>⏳</span> Loading quality rules…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Factor / Dimension</th>
                  <th>Unit</th>
                  <th>Deduction Rate (ETB / unit)</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <span className="empty-icon">⚖️</span>
                        No quality rules matching criteria.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((r) => {
                    const isEditing = editingId === r.qualityRuleId;
                    return (
                      <tr key={r.qualityRuleId}>
                        <td style={{ fontWeight: 700, textTransform: "capitalize" }}>
                          {r.factor}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              style={{ width: 70, height: 32, fontSize: 13 }}
                            />
                          ) : (
                            r.unit
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--red)" }}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editDeduction}
                              onChange={(e) => setEditDeduction(e.target.value)}
                              style={{ width: 100, height: 32, fontSize: 13 }}
                            />
                          ) : (
                            `${Number(r.deductionPerUnit).toFixed(2)} ETB / ${r.unit}`
                          )}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                          {r.notes || "—"}
                        </td>
                        <td>
                          <span className={`badge ${r.isActive ? "badge-green" : "badge-gray"}`}>
                            {r.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => handleSaveInlineEdit(r.qualityRuleId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(r.qualityRuleId);
                                  setEditUnit(r.unit);
                                  setEditDeduction(String(r.deductionPerUnit));
                                }}
                              >
                                Edit Rate
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{
                                  color: r.isActive ? "var(--red)" : "var(--green)",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleToggleStatus(r)}
                              >
                                {r.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted" style={{ fontSize: "12.5px", marginTop: "1rem" }}>
        Need to configure piece rate pricing for fabrics or yarns? Go to{" "}
        <Link to="/admin/prices" style={{ color: "var(--brand)", fontWeight: 600 }}>
          Price Management →
        </Link>
      </p>
    </div>
  );
}

export default QualityRulesPage;
