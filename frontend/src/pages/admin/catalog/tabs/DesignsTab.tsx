import React from "react";
import { Button, Card, FormField } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

export interface DesignsTabProps {
  designs: any[];
  selectedDesign: any | null;
  onSelectDesign: (d: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editDescription?: string;
  onEditDescriptionChange?: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function DesignsTab({
  designs,
  selectedDesign,
  onSelectDesign,
  editName,
  onEditNameChange,
  onSaveSpecs,
  saving,
}: DesignsTabProps) {
  return (
    <div className="master-detail">
      {/* Left Column: Designs Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Design pattern · ጥበብ/ስልት</th>
              <th>ID</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {designs.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted catalog-empty-cell">
                  No designs recorded.
                </td>
              </tr>
            ) : (
              designs.map((d) => {
                const isSelected = selectedDesign?.designId === d.designId;
                return (
                  <tr
                    key={d.designId}
                    onClick={() => onSelectDesign(d)}
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                  >
                    <td>
                      <strong className="text-brand text-base">{toTitleCase(d.name)}</strong>
                    </td>
                    <td className="text-muted">#{d.designId}</td>
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

      {/* Right Column: Edit Design Card */}
      {selectedDesign ? (
        <Card className="catalog-edit-card">
          <div className="cluster-between catalog-edit-header">
            <div>
              <h3 className="text-lg font-bold">
                Edit design · {toTitleCase(selectedDesign.name)}
              </h3>
              <p className="text-muted text-xs">
                Update pattern name
              </p>
            </div>
          </div>

          <form onSubmit={onSaveSpecs} className="stack">
            <FormField label="Design name · የስልት/ጥበብ ስም" required>
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
          <p className="text-muted text-sm">Select a design pattern to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default DesignsTab;
