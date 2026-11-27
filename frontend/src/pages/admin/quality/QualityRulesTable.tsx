import type { QualityRuleRow } from "../../../api";
import { toTitleCase } from "../../../utils/formatters";

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
              <th className="rule-col-factor">Factor</th>
              <th className="rule-col-deduction">Deduction</th>
              <th className="rule-col-unit">Unit</th>
              <th className="rule-col-status">Status</th>
              <th className="rule-col-action"></th>
            </tr>
          </thead>
          <tbody>
            {loading && rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted p-8">
                  Loading quality rules…
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted p-8">
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
                    : toTitleCase(rule.factor);

                return (
                  <tr
                    key={rule.qualityRuleId}
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelectRule(rule)}
                  >
                    <td>
                      <span className="font-semibold text-main">
                        {factorLabel}
                      </span>
                    </td>
                    <td className="text-sm font-medium">
                      <strong>{Number(rule.deductionPerUnit)} ETB</strong> per{" "}
                      {rule.unit === "g" ? "gram short" : `${toTitleCase(rule.unit)} short`}
                    </td>
                    <td className="text-sm text-muted">
                      {toTitleCase(rule.unit)}
                    </td>
                    <td>
                      {rule.isActive !== false ? (
                        <span className="badge badge--success">✓ Active</span>
                      ) : (
                        <span className="badge badge--neutral">Closed</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="row-chevron">›</span>
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

export default QualityRulesTable;
