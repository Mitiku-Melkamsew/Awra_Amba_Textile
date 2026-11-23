import { useEffect, useState, useMemo } from "react";
import { catalogApi, type Fabric, type QualityRuleRow, type FabricPriceRow } from "../../api";

export function WeaverCalculatorPage() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [prices, setPrices] = useState<FabricPriceRow[]>([]);
  const [qualityRules, setQualityRules] = useState<QualityRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFabricId, setSelectedFabricId] = useState("");
  const [piecesInput, setPiecesInput] = useState("42");
  const [weightInput, setWeightInput] = useState("63.9");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.fabrics().catch(() => []),
      catalogApi.fabricPrices().catch(() => []),
      catalogApi.qualityRules().catch(() => []),
    ])
      .then(([fList, pList, qrList]) => {
        const activeFabrics = fList.filter((f: any) => f.isActive !== false);
        setFabrics(activeFabrics);
        setPrices(pList.filter((p: any) => p.isActive !== false));
        setQualityRules(qrList.filter((r: any) => r.isActive !== false));

        if (activeFabrics.length > 0) {
          setSelectedFabricId(String(activeFabrics[0].fabricId));
          const stdWeight = activeFabrics[0].standardWeightG;
          if (stdWeight) {
            setWeightInput(String(stdWeight));
          }
        }
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load calculator parameters"))
      .finally(() => setLoading(false));
  }, []);

  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => String(f.fabricId) === selectedFabricId) || fabrics[0] || null;
  }, [fabrics, selectedFabricId]);

  const activeRate = useMemo(() => {
    if (!selectedFabric) return 1300;
    const p = prices.find((price) => price.fabricId === selectedFabric.fabricId);
    return p ? parseFloat(String(p.weaverRate || "0")) : 1300;
  }, [prices, selectedFabric]);

  const activeDeductionRate = useMemo(() => {
    const r = qualityRules.find((rule) => rule.factor === "weight");
    return r ? parseFloat(String(r.deductionPerUnit || "0")) : 10;
  }, [qualityRules]);

  const standardWeight = selectedFabric
    ? parseFloat(String(selectedFabric.standardWeightG || "64"))
    : 64;

  // Calculation values
  const pieces = Math.max(0, parseInt(piecesInput, 10) || 0);
  const avgWeight = parseFloat(weightInput) || 0;
  const countedWeight = Math.floor(avgWeight);
  const gramsShort = Math.max(0, Math.round(standardWeight - countedWeight));

  const grossValue = pieces * activeRate;
  const totalDeductions = gramsShort * activeDeductionRate * pieces;
  const youWouldReceive = Math.max(0, grossValue - totalDeductions);

  return (
    <div>
      {/* ── Page Header (Image 1) ── */}
      <div className="weaver-page-header">
        <h1 className="weaver-page-title">Calculator · ስሌት</h1>
        <p className="weaver-page-subtitle">See what you would be paid</p>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.25rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <span>⏳</span> Loading calculator…
        </div>
      ) : (
        <div className="weaver-rates-card">
          {/* ── Fabric Selector ── */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="fabric-select"
              style={{
                display: "block",
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "var(--text, #1E293B)",
                marginBottom: "0.4rem",
              }}
            >
              Fabric · የጨርቅ አይነት
            </label>
            <select
              id="fabric-select"
              value={selectedFabricId}
              onChange={(e) => {
                setSelectedFabricId(e.target.value);
                const fab = fabrics.find((f) => String(f.fabricId) === e.target.value);
                if (fab && fab.standardWeightG) {
                  setWeightInput(String(fab.standardWeightG));
                }
              }}
              className="styled-select"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                borderRadius: "10px",
                border: "1px solid var(--border, #CBD5E1)",
                background: "#FFFFFF",
              }}
            >
              {fabrics.map((f) => (
                <option key={f.fabricId} value={f.fabricId}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Pieces Returned & Average Weight Inputs (Image 1) ── */}
          <div className="weaver-calc-grid">
            <div>
              <label
                htmlFor="pieces-input"
                style={{
                  display: "block",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--text, #1E293B)",
                  marginBottom: "0.4rem",
                }}
              >
                Pieces returned
              </label>
              <input
                id="pieces-input"
                type="number"
                min="0"
                value={piecesInput}
                onChange={(e) => setPiecesInput(e.target.value)}
                className="input-field"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "1px solid var(--border, #CBD5E1)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="weight-input"
                style={{
                  display: "block",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--text, #1E293B)",
                  marginBottom: "0.4rem",
                }}
              >
                Average weight (g)
              </label>
              <input
                id="weight-input"
                type="number"
                step="0.1"
                min="0"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="input-field"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "1px solid var(--border, #CBD5E1)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* ── Cooperative Rules Info Pill (Image 1) ── */}
          <div className="weaver-calc-rule-box">
            Set by the cooperative: rate{" "}
            <strong>{Math.round(activeRate).toLocaleString()} ETB</strong> per piece · standard
            weight <strong>{standardWeight} g</strong> · deduction{" "}
            <strong>{activeDeductionRate} ETB</strong> per gram short
          </div>

          {/* ── Calculation Highlight Card (Image 1) ── */}
          <div className="weaver-calc-result-card">
            <div className="weaver-calc-result-label">You would receive</div>
            <div className="weaver-calc-result-total">
              {Math.round(youWouldReceive).toLocaleString()} ETB
            </div>

            <div className="weaver-calc-breakdown-line">
              {pieces} pieces × {Math.round(activeRate).toLocaleString()} ={" "}
              {Math.round(grossValue).toLocaleString()}
            </div>

            <div className="weaver-calc-breakdown-line">
              {gramsShort > 0 ? (
                <>
                  Average {avgWeight} g counts as {countedWeight} g:{" "}
                  <strong>{gramsShort} g short</strong>
                </>
              ) : (
                <>Average {avgWeight} g: meets cooperative standard weight ({standardWeight} g)</>
              )}
            </div>

            {gramsShort > 0 && (
              <div className="weaver-calc-breakdown-line">
                Deduction {gramsShort} × {activeDeductionRate} × {pieces} pieces ={" "}
                <strong>-{Math.round(totalDeductions).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeaverCalculatorPage;
