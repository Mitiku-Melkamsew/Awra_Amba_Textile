import React from "react";
import { Button, Card, FormField } from "../../../../components/common";

export interface DesignsTabProps {
  designs: any[];
  selectedDesign: any | null;
  onSelectDesign: (d: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editDescription: string;
  onEditDescriptionChange: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function DesignsTab({
  designs,
  selectedDesign,
  onSelectDesign,
  editName,
  onEditNameChange,
  editDescription,
  onEditDescriptionChange,
  onSaveSpecs,
  saving,
}: DesignsTabProps) {
  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Designs Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Design pattern · ጥበብ/ስልት</th>
              <th>Description</th>
              <th>ID</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {designs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
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
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td>
                      <strong className="text-brand text-base">{d.name}</strong>
                    </td>
                    <td className="text-muted">{d.description || "—"}</td>
                    <td className="text-muted">#{d.designId}</td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDesign(d);
                        }}
                      >
                        Edit
                      </Button>
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
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                Edit design · {selectedDesign.name}
              </h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                Update pattern details
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

            <FormField label="Description · መግለጫ">
              <input
                type="text"
                className="input"
                value={editDescription}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
                placeholder="Optional notes or motif description"
              />
            </FormField>

            <Button type="submit" variant="primary" isLoading={saving} style={{ width: "100%" }}>
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <p className="text-muted text-sm">Select a design pattern to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default DesignsTab;
