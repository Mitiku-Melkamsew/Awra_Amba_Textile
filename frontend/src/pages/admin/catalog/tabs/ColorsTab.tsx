import React from "react";
import { Button, Card, FormField } from "../../../../components/common";

export interface ColorsTabProps {
  colors: any[];
  selectedColor: any | null;
  onSelectColor: (c: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editHex: string;
  onEditHexChange: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function ColorsTab({
  colors,
  selectedColor,
  onSelectColor,
  editName,
  onEditNameChange,
  editHex,
  onEditHexChange,
  onSaveSpecs,
  saving,
}: ColorsTabProps) {
  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Colors Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Color · ቀለም</th>
              <th>Hex swatch</th>
              <th>ID</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {colors.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
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
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td>
                      <strong className="text-brand text-base">{c.name}</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: c.hexCode || "#CCCCCC",
                            border: "1px solid var(--border)",
                            display: "inline-block",
                          }}
                        />
                        <code style={{ fontSize: "12px" }}>{c.hexCode || "—"}</code>
                      </div>
                    </td>
                    <td className="text-muted">#{c.colorId}</td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectColor(c);
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

      {/* Right Column: Edit Color Card */}
      {selectedColor ? (
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                Edit color · {selectedColor.name}
              </h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                Update shade name and hex code
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

            <FormField label="Hex code · የቀለም ኮድ">
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={editHex || "#000000"}
                  onChange={(e) => onEditHexChange(e.target.value)}
                  style={{
                    width: 42,
                    height: 38,
                    padding: 0,
                    border: "1.5px solid var(--border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  className="input"
                  value={editHex}
                  onChange={(e) => onEditHexChange(e.target.value)}
                  placeholder="#FFFFFF"
                  style={{ flex: 1 }}
                />
              </div>
            </FormField>

            <Button type="submit" variant="primary" isLoading={saving} style={{ width: "100%" }}>
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <p className="text-muted text-sm">Select a color to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default ColorsTab;
