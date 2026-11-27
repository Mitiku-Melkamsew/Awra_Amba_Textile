import React from "react";
import { Badge, Button, Card, FormField } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

export interface YarnsTabProps {
  yarns: any[];
  selectedYarn: any | null;
  onSelectYarn: (y: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  onToggleStatus: () => Promise<void>;
  saving: boolean;
}

export function YarnsTab({
  yarns,
  selectedYarn,
  onSelectYarn,
  editName,
  onEditNameChange,
  onSaveSpecs,
  onToggleStatus,
  saving,
}: YarnsTabProps) {
  return (
    <div className="master-detail">
      {/* Left Column: Yarns Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Yarn name · ክር</th>
              <th>Status</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {yarns.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted catalog-empty-cell">
                  No yarns recorded.
                </td>
              </tr>
            ) : (
              yarns.map((y) => {
                const isSelected = selectedYarn?.yarnId === y.yarnId;
                const isActive = y.isActive !== false;
                return (
                  <tr
                    key={y.yarnId}
                    onClick={() => onSelectYarn(y)}
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                  >
                    <td>
                      <strong className="text-brand text-base">{toTitleCase(y.name)}</strong>
                    </td>
                    <td>
                      <Badge variant={isActive ? "success" : "neutral"} pill dot>
                        {isActive ? "Active" : "Deactivated"}
                      </Badge>
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

      {/* Right Column: Edit Yarn Card */}
      {selectedYarn ? (
        <Card className="catalog-edit-card">
          <div className="cluster-between catalog-edit-header">
            <div>
              <h3 className="text-lg font-bold">
                Edit yarn · {toTitleCase(selectedYarn.name)}
              </h3>
              <p className="text-muted text-xs">
                Update yarn catalog entry
              </p>
            </div>
            <Button
              variant={selectedYarn.isActive !== false ? "danger" : "secondary"}
              size="sm"
              onClick={onToggleStatus}
              isLoading={saving}
            >
              {selectedYarn.isActive !== false ? "Deactivate" : "Reactivate"}
            </Button>
          </div>

          <form onSubmit={onSaveSpecs} className="stack">
            <FormField label="Yarn name · የክር ስም" required>
              <input
                type="text"
                className="input"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                required
              />
            </FormField>

            <Button type="submit" variant="primary" isLoading={saving} className="btn-full-width">
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="catalog-edit-placeholder">
          <p className="text-muted text-sm">Select a yarn to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default YarnsTab;
