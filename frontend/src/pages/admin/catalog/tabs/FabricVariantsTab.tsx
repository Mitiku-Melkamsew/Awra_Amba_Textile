import type { FabricVariant } from "../../../../api";
import { Badge, Button, Card } from "../../../../components/common";

export interface FabricVariantsTabProps {
  variants: FabricVariant[];
  showDeactivated: boolean;
  selectedVariant: FabricVariant | null;
  onSelectVariant: (fv: FabricVariant) => void;
  onToggleStatus: () => Promise<void>;
  saving: boolean;
}

export function FabricVariantsTab({
  variants,
  showDeactivated,
  selectedVariant,
  onSelectVariant,
  onToggleStatus,
  saving,
}: FabricVariantsTabProps) {
  const filtered = variants.filter((v) => (showDeactivated ? true : v.isActive !== false));

  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Variants Table */}
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
                <td colSpan={7} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                  No fabric variants configured.
                </td>
              </tr>
            ) : (
              filtered.map((fv) => {
                const isSelected = selectedVariant?.fabricVariantId === fv.fabricVariantId;
                const isActive = fv.isActive !== false;
                return (
                  <tr
                    key={fv.fabricVariantId}
                    onClick={() => onSelectVariant(fv)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td className="font-bold text-brand">{fv.sku}</td>
                    <td>{fv.fabric?.name ?? "Fabric"}</td>
                    <td>{fv.warpColor?.name ?? "Natural"}</td>
                    <td>{fv.weftColor?.name ?? "Natural"}</td>
                    <td>{fv.design?.name ?? "Standard"}</td>
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
                          onSelectVariant(fv);
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
                Fabric Variant Details
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
              <span className="text-muted text-xs uppercase font-bold">Base Fabric: </span>
              <strong>{selectedVariant.fabric?.name ?? "—"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Warp Color: </span>
              <strong>{selectedVariant.warpColor?.name ?? "Natural"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Weft Color: </span>
              <strong>{selectedVariant.weftColor?.name ?? "Natural"}</strong>
            </div>
            <div>
              <span className="text-muted text-xs uppercase font-bold">Design Pattern: </span>
              <strong>{selectedVariant.design?.name ?? "Standard"}</strong>
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
          <p className="text-muted text-sm">Select a fabric variant to manage status</p>
        </Card>
      )}
    </div>
  );
}

export default FabricVariantsTab;
