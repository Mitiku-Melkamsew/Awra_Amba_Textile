import type { FabricVariant } from "../../../../api";
import { Badge } from "../../../../components/common";

export interface FabricVariantsTabProps {
  variants: FabricVariant[];
  showDeactivated: boolean;
}

export function FabricVariantsTab({ variants, showDeactivated }: FabricVariantsTabProps) {
  const filtered = variants.filter((v) => (showDeactivated ? true : v.isActive !== false));

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Fabric</th>
            <th>Warp color</th>
            <th>Weft color</th>
            <th>Design pattern</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No fabric variants configured.
              </td>
            </tr>
          ) : (
            filtered.map((fv) => (
              <tr key={fv.fabricVariantId}>
                <td className="font-bold text-brand">{fv.sku}</td>
                <td>{fv.fabric?.name ?? "Fabric"}</td>
                <td>{fv.warpColor?.name ?? "Natural"}</td>
                <td>{fv.weftColor?.name ?? "Natural"}</td>
                <td>{fv.design?.name ?? "Standard"}</td>
                <td>
                  <Badge variant={fv.isActive !== false ? "success" : "neutral"} pill dot>
                    {fv.isActive !== false ? "Active" : "Deactivated"}
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

export default FabricVariantsTab;
