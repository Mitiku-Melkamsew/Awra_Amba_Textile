import { Badge, Button } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

export interface YarnVariantsTabProps {
  variants: any[];
  selectedVariant?: any | null;
  onSelectVariant?: (yv: any) => void;
  onToggleStatus: (yv: any) => Promise<void>;
  saving: boolean;
}

export function YarnVariantsTab({
  variants,
  onToggleStatus,
  saving,
}: YarnVariantsTabProps) {
  return (
    <div className="master-detail no-panel">
      {/* Variants Table - Full Width */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Yarn</th>
              <th>Color</th>
              <th>Supplier</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted catalog-empty-cell">
                  No yarn variants recorded.
                </td>
              </tr>
            ) : (
              variants.map((yv) => {
                const isActive = yv.isActive !== false;
                return (
                  <tr key={yv.yarnVariantId}>
                    <td className="font-bold text-brand">{yv.sku}</td>
                    <td>{toTitleCase(yv.yarn?.name ?? "Yarn")}</td>
                    <td>{toTitleCase(yv.color?.name ?? "Natural")}</td>
                    <td>{toTitleCase(yv.supplier?.name ?? "Supplier")}</td>
                    <td>
                      <Badge variant={isActive ? "success" : "neutral"} pill dot>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        variant={isActive ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => onToggleStatus(yv)}
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

export default YarnVariantsTab;
