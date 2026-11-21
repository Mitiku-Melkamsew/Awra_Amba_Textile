import type { QualityRuleRow } from "../../../api";

export interface QualityRulesTableProps {
  rules: QualityRuleRow[];
  loading: boolean;
  selectedRule: QualityRuleRow | null;
  onSelectRule: (rule: QualityRuleRow) => void;
}

export function QualityRulesTable({
  rules,
  loading,
  selectedRule,
  onSelectRule,
}: QualityRulesTableProps) {
  return (
    <div className="data-table-container">
      <div className="prices-table-card">
        <table className="data-table">
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
                <td
                  colSpan={5}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-muted, #64748B)",
                  }}
                >
                  Loading quality rules…
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-muted, #64748B)",
                  }}
                >
                  No rules configured.
                </td>
              </tr>
            ) : (
              rules.map((rule) => {
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
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelectRule(rule)}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--text, #0F172A)" }}>
                        {factorLabel}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: "13.5px",
                        color: "var(--text, #0F172A)",
                        fontWeight: 500,
                      }}
                    >
                      <strong>{Number(rule.deductionPerUnit)} ETB</strong> per{" "}
                      {rule.unit === "g" ? "gram short" : `${rule.unit} short`}
                    </td>
                    <td style={{ fontSize: "13.5px", color: "var(--text-muted, #64748B)" }}>
                      {rule.unit}
                    </td>
                    <td>
                      {rule.isActive !== false ? (
                        <span className="badge badge--success">✓ Active</span>
                      ) : (
                        <span className="badge badge--gray">Closed</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRule(rule);
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
  );
}
