import { useState } from "react";
import type { FormEvent } from "react";
import { calculationsApi } from "../api";
import type { BonusResult, DeductionResult } from "../api";

const FABRIC_THRESHOLDS: Record<string, number> = {
  "f-01": 64,
  "f-02": 71,
  "f-03": 78,
  "f-04": 84,
  "f-05": 90,
};

export function CalculatorPage() {
  const [fabricCode, setFabricCode] = useState("f-04");
  const [avgWeight, setAvgWeight] = useState("81");
  const [unitPrice, setUnitPrice] = useState("1707");
  const [quantity, setQuantity] = useState("33");
  const [deduction, setDeduction] = useState<DeductionResult | null>(null);
  const [bonus, setBonus] = useState<BonusResult | null>(null);
  const [error, setError] = useState("");

  async function handleCalculate(event: FormEvent) {
    event.preventDefault();
    setError("");
    const threshold = FABRIC_THRESHOLDS[fabricCode] ?? 0;
    const payload = {
      avgWeight: Number(avgWeight),
      unitPrice: Number(unitPrice),
      quantity: Number(quantity),
      minWeightThreshold: threshold,
    };

    try {
      const [deductionResult, bonusResult] = await Promise.all([
        calculationsApi.deduction(payload),
        calculationsApi.bonus(payload),
      ]);
      setDeduction(deductionResult);
      setBonus(bonusResult);
    } catch (err) {
      setDeduction(null);
      setBonus(null);
      setError(err instanceof Error ? err.message : "Calculation failed");
    }
  }

  const netLine =
    deduction && bonus ? deduction.lineCredit + bonus.totalBonus : null;

  return (
    <section>
      <h2>Calculation Preview</h2>
      <div className="grid">
        <form className="card form" onSubmit={handleCalculate}>
          <label>
            Fabric code
            <select value={fabricCode} onChange={(e) => setFabricCode(e.target.value)}>
              {Object.entries(FABRIC_THRESHOLDS).map(([code, threshold]) => (
                <option key={code} value={code}>
                  {code} (min {threshold})
                </option>
              ))}
            </select>
          </label>
          <label>
            Average weight
            <input value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)} />
          </label>
          <label>
            Unit price (ETB)
            <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </label>
          <label>
            Quantity
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <button type="submit">Calculate</button>
        </form>

        <div className="card">
          <h3>Results</h3>
          {deduction ? (
            <>
              <p>Deduction / piece: {deduction.deductionPerPiece} ETB</p>
              <p>Adjusted price: {deduction.adjustedUnitPrice} ETB</p>
              <p>Fabric credit: {deduction.lineCredit} ETB</p>
              <p className="muted">{deduction.remark}</p>
            </>
          ) : (
            <p className="muted">Run a calculation to see deduction output.</p>
          )}
          {bonus && (
            <>
              <p>Bonus / piece: {bonus.bonusPerPiece} ETB</p>
              <p>Total bonus: {bonus.totalBonus} ETB</p>
              <p className="muted">{bonus.remark}</p>
            </>
          )}
          {netLine != null && (
            <p className="net">
              Net line total: <strong>{netLine} ETB</strong>
            </p>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}