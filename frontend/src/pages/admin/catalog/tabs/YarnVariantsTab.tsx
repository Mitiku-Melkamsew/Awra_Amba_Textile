import { Badge } from "../../../../components/common";

export interface YarnVariantsTabProps {
  variants: any[];
}

export function YarnVariantsTab({ variants }: YarnVariantsTabProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Yarn</th>
            <th>Color</th>
            <th>Supplier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {variants.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No yarn variants recorded.
              </td>
            </tr>
          ) : (
            variants.map((yv) => (
              <tr key={yv.yarnVariantId}>
                <td className="font-bold text-brand">{yv.sku}</td>
                <td>{yv.yarn?.name ?? "Yarn"}</td>
                <td>{yv.color?.name ?? "Natural"}</td>
                <td>{yv.supplier?.name ?? "Supplier"}</td>
                <td>
                  <Badge variant={yv.isActive !== false ? "success" : "neutral"} pill dot>
                    {yv.isActive !== false ? "Active" : "Deactivated"}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default YarnVariantsTab;
