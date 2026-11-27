import React from "react";
import type { FabricWithRates } from "../useCatalogData";
import { Badge, Button, Card, FormField } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

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
    <div className="master-detail">
      {/* Left Column: Fabrics Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fabric · የጨርቅ አይነት</th>
              <th className="numeric">Standard weight</th>
              <th className="numeric">Standard size</th>
              <th>Status</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((f) => {
              const isSelected = selectedFabric?.fabricId === f.fabricId;
              return (
                <tr
                  key={f.fabricId}
                  onClick={() => onSelectFabric(f)}
                  className={`selectable-row ${isSelected ? "selected" : ""}`}
                >
                  <td>
                    <strong className="text-brand text-base catalog-capitalize">
                      {toTitleCase(f.name)}
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
                    <span className="row-chevron">›</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right Column: Fabric Specs & Rules Editor Card */}
      {selectedFabric ? (
        <Card className="catalog-edit-card">
          <div className="cluster-between catalog-edit-header">
            <h3 className="card-title catalog-capitalize">
              {toTitleCase(selectedFabric.name)}
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

            <Button type="submit" variant="primary" isLoading={saving} className="btn-full-width">
              Save changes
            </Button>
          </form>

          <div className="catalog-card-footer">
            <Button
              variant={selectedFabric.isActive ? "ghost" : "secondary"}
              size="sm"
              onClick={onToggleStatus}
              disabled={saving}
              className={`btn-full-width ${selectedFabric.isActive ? "text-danger" : "text-success"}`}
            >
              {selectedFabric.isActive ? "Deactivate fabric" : "Reactivate fabric"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="catalog-edit-placeholder text-muted">
          Select a fabric to configure standard specifications.
        </Card>
      )}
    </div>
  );
}

export default FabricsTab;
