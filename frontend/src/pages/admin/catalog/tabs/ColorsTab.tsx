import React from "react";
import { Button, Card, FormField } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

export interface ColorsTabProps {
  colors: any[];
  selectedColor: any | null;
  onSelectColor: (c: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editHex?: string;
  onEditHexChange?: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function ColorsTab({
  colors,
  selectedColor,
  onSelectColor,
  editName,
  onEditNameChange,
  onSaveSpecs,
  saving,
}: ColorsTabProps) {
  return (
    <div className="master-detail catalog-master-detail">
      {/* Left Column: Colors Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Color · ቀለም</th>
              <th>ID</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {colors.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted catalog-empty-cell">
                  No colors recorded.
                </td>
              </tr>
            ) : (
              colors.map((c) => {
                const isSelected = selectedColor?.colorId === c.colorId;
                return (
                  <tr
                    key={c.colorId}
                    onClick={() => onSelectColor(c)}
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                  >
                    <td>
                      <strong className="text-brand text-base">{toTitleCase(c.name)}</strong>
                    </td>
                    <td className="text-muted">#{c.colorId}</td>
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

      {/* Right Column: Edit Color Card */}
      {selectedColor ? (
        <Card className="catalog-edit-card">
          <div className="cluster-between catalog-edit-header">
            <div>
              <h3 className="text-lg font-bold">
                Edit color · {toTitleCase(selectedColor.name)}
              </h3>
              <p className="text-muted text-xs">
                Update shade name
              </p>
            </div>
          </div>

          <form onSubmit={onSaveSpecs} className="stack">
            <FormField label="Color name · የቀለም ስም" required>
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
          <p className="text-muted text-sm">Select a color to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default ColorsTab;
