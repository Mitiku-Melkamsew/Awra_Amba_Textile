import { Badge, Button, Card } from "../../../../components/common";

export interface YarnVariantsTabProps {
  variants: any[];
  selectedVariant: any | null;
  onSelectVariant: (yv: any) => void;
  onToggleStatus: () => Promise<void>;
  saving: boolean;
}

export function YarnVariantsTab({
  variants,
  selectedVariant,
  onSelectVariant,
  onToggleStatus,
  saving,
}: YarnVariantsTabProps) {
  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Variants Table */}
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
                <td colSpan={6} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                  No yarn variants recorded.
                </td>
              </tr>
            ) : (
              variants.map((yv) => {
                const isSelected = selectedVariant?.yarnVariantId === yv.yarnVariantId;
                const isActive = yv.isActive !== false;
                return (
                  <tr
                    key={yv.yarnVariantId}
                    onClick={() => onSelectVariant(yv)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td className="font-bold text-brand">{yv.sku}</td>
                    <td>{yv.yarn?.name ?? "Yarn"}</td>
                    <td>{yv.color?.name ?? "Natural"}</td>
                    <td>{yv.supplier?.name ?? "Supplier"}</td>
                    <td>
                      <Badge variant={isActive ? "success" : "neutral"} pill dot>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVariant(yv);
                        }}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Right Column: Manage Variant Card */}
      {selectedVariant ? (
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                {selectedVariant.sku}
              </h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                Yarn Variant Details
              </p>
            </div>
            <Button
              variant={selectedVariant.isActive !== false ? "danger" : "secondary"}
              size="sm"
              onClick={onToggleStatus}
              isLoading={saving}
            >
              {selectedVariant.isActive !== false ? "Deactivate" : "Reactivate"}
            </Button>
          </div>

          <div className="stack" style={{ gap: "0.75rem", fontSize: "13.5px" }}>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Base Yarn: </span>
              <strong>{selectedVariant.yarn?.name ?? "—"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Color: </span>
              <strong>{selectedVariant.color?.name ?? "Natural"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Supplier: </span>
              <strong>{selectedVariant.supplier?.name ?? "Cooperative"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Status: </span>
              <Badge variant={selectedVariant.isActive !== false ? "success" : "neutral"} pill dot>
                {selectedVariant.isActive !== false ? "Active for Transactions" : "Deactivated"}
              </Badge>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <p className="text-muted text-sm">Select a yarn variant to manage status</p>
        </Card>
      )}
    </div>
  );
}

export default YarnVariantsTab;
