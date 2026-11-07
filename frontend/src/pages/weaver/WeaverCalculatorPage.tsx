import { Link } from "react-router-dom";
import { WeaverWageCalculator } from "../../components/WeaverWageCalculator";

export function WeaverCalculatorPage() {
  return (
    <div className="page">
      <Link to="/weaver" className="back-link">
        ← Back to My Work Orders / ወደ ዝግ ዝርዝር
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow" style={{ background: "#D1FAE5", color: "#065F46" }}>
            የገቢና የጥራት ስሌት / Earnings Simulation
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Weaver Wage & Deduction Calculator</h1>
          </div>
          <p className="page-subtitle">
            Simulate your gross piece-rate wage, quality weight tolerance deductions, and expected net earnings based on active cooperative rules.
          </p>
        </div>
      </div>

      <WeaverWageCalculator />
    </div>
  );
}

export default WeaverCalculatorPage;
