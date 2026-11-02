import { useState } from "react";
import type { FormEvent } from "react";
import { calculationsApi } from "../api";
import type { DeductionResult } from "../api";

const FABRIC_THRESHOLDS: Record<string, { threshold: number; name: string }> = {
  "f-01": { threshold: 64, name: "Fabric Code 01 (Min 64g)" },
  "f-02": { threshold: 71, name: "Fabric Code 02 (Min 71g)" },
  "f-03": { threshold: 78, name: "Fabric Code 03 (Min 78g)" },
  "f-04": { threshold: 84, name: "Fabric Code 04 (Min 84g)" },
  "f-05": { threshold: 90, name: "Fabric Code 05 (Min 90g)" },
  "f-06": { threshold: 42, name: "Fabric Code 06 (Min 42g)" },
};

export function CalculatorPage() {
  const [fabricCode, setFabricCode] = useState("f-04");
  const [avgWeight, setAvgWeight] = useState("81");
  const [unitPrice, setUnitPrice] = useState("1707");
  const [quantity, setQuantity] = useState("33");
  const [deduction, setDeduction] = useState<DeductionResult | null>(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);

  async function handleCalculate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCalculating(true);
    const threshold = FABRIC_THRESHOLDS[fabricCode]?.threshold ?? 0;
    const payload = {
      avgWeight: Number(avgWeight),
      unitPrice: Number(unitPrice),
      quantity: Number(quantity),
      minWeightThreshold: threshold,
    };

    try {
      const deductionResult = await calculationsApi.deduction(payload);
      setDeduction(deductionResult);
    } catch (err) {
      setDeduction(null);
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  }

  const netLine = deduction ? deduction.lineCredit : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ስሌት / Settlement Algorithm</p>
          <h1 className="page-title">Fabric Quality Deduction Calculator</h1>
          <p className="page-subtitle">
            Preview weight threshold calculations, piece-level penalty adjustments, and net payable line credits.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Form Card */}
        <form className="card form" onSubmit={handleCalculate}>
          <h3 className="section-title" style={{ margin: 0 }}>
            <span>📐</span> Input Parameters / መለኪያዎች
          </h3>

          <label>
            <span>Fabric Standard Code / የጨርቁ ኮድ</span>
            <select
              value={fabricCode}
              onChange={(e) => setFabricCode(e.target.value)}
              style={{ height: 42 }}
            >
              {Object.entries(FABRIC_THRESHOLDS).map(([code, info]) => (
                <option key={code} value={code}>
                  {code.toUpperCase()} — {info.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              <span>Average Weight (g/piece) / ሚዛን</span>
              <input
                type="number"
                step="0.1"
                value={avgWeight}
                onChange={(e) => setAvgWeight(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Standard Unit Price (ETB) / ዋጋ</span>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            <span>Total Returned Quantity (Pieces) / ብዛት</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>

          {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={calculating}>
              {calculating ? "Calculating…" : "⚡ Run Calculation Preview"}
            </button>
          </div>
        </form>

        {/* Results Card */}
        <div className="card" style={{ background: deduction ? "#FFFFFF" : "var(--bg-subtle)", border: deduction ? "1.5px solid var(--accent)" : "1px dashed var(--border)" }}>
          <h3 className="section-title" style={{ margin: 0, marginBottom: "1rem" }}>
            <span>📊</span> Calculation Output / የሂሳብ ውጤት
          </h3>

          {deduction ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Quality Threshold
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>
                    {deduction.threshold} g
                  </div>
                </div>

                <div style={{ background: deduction.deductionPerPiece > 0 ? "var(--red-bg)" : "var(--green-bg)", padding: "0.85rem", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: deduction.deductionPerPiece > 0 ? "var(--red)" : "var(--green)" }}>
                    Deduction / Piece
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: deduction.deductionPerPiece > 0 ? "var(--red)" : "var(--green)" }}>
                    {deduction.deductionPerPiece > 0 ? `-${deduction.deductionPerPiece} ETB` : "0 ETB"}
                  </div>
                </div>
              </div>

              <div style={{ padding: "0.85rem", border: "1px solid var(--border)", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Adjusted Unit Price:</span>
                  <strong>{deduction.adjustedUnitPrice} ETB</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Quantity Evaluated:</span>
                  <strong>{quantity} pieces</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", color: "var(--accent)", fontWeight: 600 }}>
                  <span>Rule Applied:</span>
                  <span>{deduction.ruleApplied || "Standard Formula"}</span>
                </div>
              </div>

              {deduction.remark && (
                <div style={{ fontSize: "12.5px", background: "var(--orange-bg)", color: "var(--text)", padding: "0.6rem 0.85rem", borderRadius: "8px" }}>
                  ℹ️ {deduction.remark}
                </div>
              )}

              {netLine != null && (
                <div style={{ padding: "1rem", background: "var(--green-bg)", border: "1.5px solid var(--green-border)", borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--green)" }}>
                    Net Fabric Credit
                  </span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--green)", marginTop: "2px" }}>
                    {Number(netLine).toLocaleString()} ETB
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
              <span className="empty-icon">🧮</span>
              <p style={{ fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Awaiting calculation parameters
              </p>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                Fill in the fabric code, average piece weight, and base price, then click 'Run Calculation Preview'.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalculatorPage;
