import React from "react";
import type { FabricWithRates } from "../useCatalogData";
import { Badge, Button, Card, FormField } from "../../../../components/common";

export interface FabricsTabProps {
  fabrics: FabricWithRates[];
  selectedFabric: FabricWithRates | null;
  onSelectFabric: (f: FabricWithRates) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editWeight: string;
  onEditWeightChange: (val: string) => void;
  editLength: string;
  onEditLengthChange: (val: string) => void;
  editWidth: string;
  onEditWidthChange: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  onToggleStatus: () => Promise<void>;
  saving: boolean;
}

export function FabricsTab({
  fabrics,
  selectedFabric,
  onSelectFabric,
  editName,
  onEditNameChange,
  editWeight,
  onEditWeightChange,
  editLength,
  onEditLengthChange,
  editWidth,
  onEditWidthChange,
  onSaveSpecs,
  onToggleStatus,
  saving,
}: FabricsTabProps) {
  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Fabrics Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fabric · የጨርቅ አይነት</th>
              <th className="numeric">Standard weight</th>
              <th className="numeric">Standard size</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((f) => {
              const isSelected = selectedFabric?.fabricId === f.fabricId;
              return (
                <tr
                  key={f.fabricId}
                  onClick={() => onSelectFabric(f)}
                  style={{
                    cursor: "pointer",
                    background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                  }}
                >
                  <td>
                    <strong className="text-brand text-base" style={{ textTransform: "capitalize" }}>
                      {f.name}
                    </strong>
                  </td>
                  <td className="numeric font-medium">{f.standardWeightG} g</td>
                  <td className="numeric font-medium">
                    {f.standardLengthCm} × {f.standardWidthCm} cm
                  </td>
                  <td>
                    <Badge variant={f.isActive ? "success" : "neutral"} pill dot>
                      {f.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFabric(f);
                      }}
                    >
                      Configure
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right Column: Fabric Specs & Rules Editor Card */}
      {selectedFabric ? (
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <h3 className="card-title" style={{ textTransform: "capitalize" }}>
              {selectedFabric.name}
            </h3>
            <Badge variant={selectedFabric.isActive ? "success" : "neutral"} pill dot>
              {selectedFabric.isActive ? "Active" : "Deactivated"}
            </Badge>
          </div>

          <form onSubmit={onSaveSpecs} className="stack">
            <FormField label="Fabric name · ስም" required>
              <input
                type="text"
                className="input"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Standard weight (ግራም)" hint="Gram threshold for defect calculations">
              <input
                type="number"
                className="input"
                value={editWeight}
                onChange={(e) => onEditWeightChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Standard length (cm)">
              <input
                type="number"
                className="input"
                value={editLength}
                onChange={(e) => onEditLengthChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Standard width (cm)">
              <input
                type="number"
                className="input"
                value={editWidth}
                onChange={(e) => onEditWidthChange(e.target.value)}
                required
              />
            </FormField>

            <Button type="submit" variant="primary" isLoading={saving} style={{ width: "100%" }}>
              Save changes
            </Button>
          </form>

          <div style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)" }}>
            <Button
              variant={selectedFabric.isActive ? "ghost" : "secondary"}
              size="sm"
              onClick={onToggleStatus}
              disabled={saving}
              style={{ width: "100%", color: selectedFabric.isActive ? "var(--red)" : "var(--green)" }}
            >
              {selectedFabric.isActive ? "Deactivate fabric" : "Reactivate fabric"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-muted)" }}>
          Select a fabric to configure standard specifications.
        </Card>
      )}
    </div>
  );
}

export default FabricsTab;
