import { useEffect, useState, useMemo } from "react";
import { catalogApi, type Fabric, type QualityRuleRow } from "../api";

export function WeaverWageCalculator() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [qualityRules, setQualityRules] = useState<QualityRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Calculator inputs
  const [selectedFabricId, setSelectedFabricId] = useState("");
  const [pieces, setPieces] = useState("20");
  const [actualWeightG, setActualWeightG] = useState("");
  const [customPieceRate, setCustomPieceRate] = useState("");
  const [customTargetWeight, setCustomTargetWeight] = useState("");
  const [customDeductionRate, setCustomDeductionRate] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.fabrics().catch(() => []),
      catalogApi.qualityRules().catch(() => []),
    ])
      .then(([fList, qrList]) => {
        const activeFabrics = fList.filter((f: any) => f.isActive !== false);
        setFabrics(activeFabrics);
        setQualityRules(qrList.filter((r: any) => r.isActive));

        if (activeFabrics.length > 0) {
          const f0 = activeFabrics[0];
          setSelectedFabricId(String(f0.fabricId));
          setCustomTargetWeight(String(f0.standardWeightG ?? 500));
          setActualWeightG(String(f0.standardWeightG ?? 500));
          const rate = (f0 as any).weaverRate ?? (f0.prices?.[0] as any)?.weaverUnitPrice ?? (f0.prices?.[0] as any)?.weaverRate ?? 150;
          setCustomPieceRate(String(rate));
        }

        const weightRule = qrList.find((r: any) => r.factor === "weight" && r.isActive);
        setCustomDeductionRate(weightRule ? String(weightRule.deductionPerUnit) : "1.00");
      })
      .catch((err) => setError(err.message || "Failed to load calculator parameters"))
      .finally(() => setLoading(false));
  }, []);

  // When fabric changes, update targets
  function handleFabricChange(fabricId: string) {
    setSelectedFabricId(fabricId);
    const fabric = fabrics.find((f) => String(f.fabricId) === fabricId);
    if (!fabric) return;

    setCustomTargetWeight(String(fabric.standardWeightG ?? 500));
    setActualWeightG(String(fabric.standardWeightG ?? 500));
    const rate = (fabric as any).weaverRate ?? (fabric.prices?.[0] as any)?.weaverUnitPrice ?? (fabric.prices?.[0] as any)?.weaverRate ?? 150;
    setCustomPieceRate(String(rate));
  }

  const selectedFabric = useMemo(
    () => fabrics.find((f) => String(f.fabricId) === selectedFabricId),
    [fabrics, selectedFabricId]
  );

  // Calculations
  const qty = Math.max(1, parseInt(pieces, 10) || 0);
  const rate = Math.max(0, parseFloat(customPieceRate) || 0);
  const targetWeight = Math.max(1, parseFloat(customTargetWeight) || 500);
  const actualWeight = Math.max(0, parseFloat(actualWeightG) || 0);
  const deductionRatePerGram = Math.max(0, parseFloat(customDeductionRate) || 1.0);

  const grossEarnings = qty * rate;
  const weightDiff = actualWeight - targetWeight;
  const isUnderweight = weightDiff < -0.01;
  const underweightGrams = isUnderweight ? Math.abs(weightDiff) : 0;
  const deductionPerPiece = isUnderweight ? Math.round(underweightGrams * deductionRatePerGram * 100) / 100 : 0;
  const totalDeductions = Math.round(deductionPerPiece * qty * 100) / 100;
  const netEarnings = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);
  const effectiveRate = qty > 0 ? Math.round((netEarnings / qty) * 100) / 100 : 0;

  if (loading) {
    return (
      <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
        <div className="loading"><span>⏳</span> Loading interactive wage calculator…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.02) 100%)",
          border: "1px solid rgba(234, 88, 12, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span className="eyebrow" style={{ background: "rgba(234, 88, 12, 0.15)", color: "#C2410C" }}>
            ስሌት / Quality Wage Calculator
          </span>
          <span className="badge badge-green">Live Database Specs</span>
        </div>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: "18px", fontWeight: 800 }}>
          Fabric Quality Deduction & Artisan Wage Calculator / የሂሳብ ማስተካከያ ማስያ
        </h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
          Simulate official HISAB quality deduction calculations. Choose a fabric to auto-load target weights, active piece rates, and deduction rules.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ padding: "1rem", borderRadius: "8px" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Main Grid: Form on Left, Live Results on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Input Parameters Form Card */}
        <div className="card form" style={{ margin: 0 }}>
          <h3 className="section-title" style={{ margin: "0 0 0.5rem" }}>
            <span>📐</span> Calculation Parameters / መለኪያዎች
          </h3>

          <label>
            <span>Fabric Product / የጨርቁ ዓይነት</span>
            <select
              value={selectedFabricId}
              onChange={(e) => handleFabricChange(e.target.value)}
              style={{ height: 42, fontWeight: 600 }}
            >
              {fabrics.map((f) => (
                <option key={f.fabricId} value={f.fabricId}>
                  🧣 {f.name} ({f.standardLengthCm}×{f.standardWidthCm}cm · {f.standardWeightG}g)
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              <span>Pieces Returned / የተመለሰ ብዛት</span>
              <input
                type="number"
                min="1"
                step="1"
                value={pieces}
                onChange={(e) => setPieces(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Actual Avg Weight (g/pc) / የተመዘነ ሚዛን</span>
              <input
                type="number"
                step="0.1"
                min="1"
                value={actualWeightG}
                onChange={(e) => setActualWeightG(e.target.value)}
                placeholder="e.g. 480"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Standard Piece Rate (ETB) / ዋጋ</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customPieceRate}
                onChange={(e) => setCustomPieceRate(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Target Standard Weight (g) / መደበኛ</span>
              <input
                type="number"
                step="0.1"
                min="1"
                value={customTargetWeight}
                onChange={(e) => setCustomTargetWeight(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            <span>Deduction Penalty Rate (ETB / gram underweight)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customDeductionRate}
              onChange={(e) => setCustomDeductionRate(e.target.value)}
              required
            />
          </label>

          {selectedFabric && (
            <div style={{ background: "var(--bg-subtle)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>ℹ️ Standard specification for <strong>{selectedFabric.name}</strong>: {selectedFabric.standardLengthCm}cm length × {selectedFabric.standardWidthCm}cm width, target {selectedFabric.standardWeightG} grams.</span>
            </div>
          )}
        </div>

        {/* Live Calculation Results Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ margin: 0, border: "1.5px solid var(--accent)", boxShadow: "var(--shadow-md)" }}>
            <h3 className="section-title" style={{ margin: "0 0 1rem" }}>
              <span>📊</span> Live Earnings Breakdown / የሂሳብ ውጤት
            </h3>

            {/* Net Payout Highlight Box */}
            <div
              style={{
                background: isUnderweight ? "var(--orange-bg)" : "var(--green-bg)",
                border: `1.5px solid ${isUnderweight ? "#FDBA74" : "var(--green-border)"}`,
                padding: "1.25rem",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: isUnderweight ? "#C2410C" : "var(--green)" }}>
                {isUnderweight ? "⚠️ Net Payable After Penalty" : "✓ Net Payable (On Standard Weight)"}
              </span>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: isUnderweight ? "#EA580C" : "var(--green)",
                  margin: "0.35rem 0 0.15rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {netEarnings.toLocaleString()} ETB
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                Effective Rate: <strong>{effectiveRate.toLocaleString()} ETB</strong> per piece ({qty} pieces)
              </span>
            </div>

            {/* Detailed Line Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
                <span className="muted">Standard Gross Wage ({qty} pcs × {rate} ETB):</span>
                <strong>{grossEarnings.toLocaleString()} ETB</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
                <span className="muted">Weight Inspection:</span>
                <span>
                  Target: <strong>{targetWeight}g</strong> | Actual: <strong>{actualWeight}g</strong>
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontWeight: 700,
                      color: isUnderweight ? "var(--red)" : "var(--green)",
                    }}
                  >
                    ({weightDiff >= 0 ? `+${weightDiff.toFixed(1)}g on-spec` : `${weightDiff.toFixed(1)}g underweight`})
                  </span>
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
                <span className="muted">Penalty Deduction per Piece:</span>
                <span style={{ color: isUnderweight ? "var(--red)" : "var(--green)", fontWeight: 700 }}>
                  {isUnderweight ? `-${deductionPerPiece.toFixed(2)} ETB/pc (${underweightGrams.toFixed(1)}g × ${deductionRatePerGram} ETB)` : "0.00 ETB (No penalty)"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="muted">Total Quality Deductions ({qty} pcs):</span>
                <span style={{ color: isUnderweight ? "var(--red)" : "var(--green)", fontWeight: 800 }}>
                  {isUnderweight ? `-${totalDeductions.toLocaleString()} ETB` : "0.00 ETB"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.25rem", fontSize: "16px", fontWeight: 800 }}>
                <span>Final Payout / ጠቅላላ ተከፋይ:</span>
                <span style={{ color: "var(--accent)" }}>{netEarnings.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="card" style={{ margin: 0, background: "var(--bg-subtle)", padding: "1rem" }}>
            <h4 style={{ margin: "0 0 0.4rem", fontSize: "13px", fontWeight: 700 }}>
              💡 Cooperative Quality Rule Explanation / ማብራሪያ
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {isUnderweight
                ? `Each returned piece weighs ${actualWeight}g, which is ${underweightGrams.toFixed(1)}g below the standard ${targetWeight}g. A penalty rate of ${deductionRatePerGram} ETB per gram is deducted per piece (${deductionPerPiece.toFixed(2)} ETB), resulting in a total deduction of ${totalDeductions.toLocaleString()} ETB across ${qty} pieces.`
                : `All ${qty} pieces meet or exceed the ${targetWeight}g threshold (measured ${actualWeight}g). Full piece rate wage of ${rate} ETB per piece is earned with 0 quality penalties.`}
            </p>
            {qualityRules.length > 0 && (
              <div style={{ marginTop: "0.5rem", fontSize: "11px", color: "var(--text-muted)" }}>
                Active quality policy: {qualityRules.map((r) => `${r.factor} (${r.deductionPerUnit} ETB/${r.unit})`).join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeaverWageCalculator;
