import type { FabricVariant } from "../../../../api";
import { Badge, Button } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

export interface FabricVariantsTabProps {
  variants: FabricVariant[];
  showDeactivated: boolean;
  selectedVariant?: FabricVariant | null;
  onSelectVariant?: (fv: FabricVariant) => void;
  onToggleStatus: (fv: FabricVariant) => Promise<void>;
  saving: boolean;
}

export function FabricVariantsTab({
  variants,
  showDeactivated,
  onToggleStatus,
  saving,
}: FabricVariantsTabProps) {
  const filtered = variants.filter((v) => (showDeactivated ? true : v.isActive !== false));

  return (
    <div className="master-detail no-panel">
      {/* Variants Table - Full Width */}
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
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted catalog-empty-cell">
                  No fabric variants configured.
                </td>
              </tr>
            ) : (
              filtered.map((fv) => {
                const isActive = fv.isActive !== false;
                return (
                  <tr key={fv.fabricVariantId}>
                    <td className="font-bold text-brand">{fv.sku}</td>
                    <td>{toTitleCase(fv.fabric?.name ?? "Fabric")}</td>
                    <td>{toTitleCase(fv.warpColor?.name ?? "Natural")}</td>
                    <td>{toTitleCase(fv.weftColor?.name ?? "Natural")}</td>
                    <td>{toTitleCase(fv.design?.name ?? "Standard")}</td>
                    <td>
                      <Badge variant={isActive ? "success" : "neutral"} pill dot>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        variant={isActive ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => onToggleStatus(fv)}
                        isLoading={saving}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </Button>
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

export default FabricVariantsTab;
