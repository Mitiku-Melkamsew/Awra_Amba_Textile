import React from "react";
import { Badge, Button, Card, FormField } from "../../../../components/common";

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
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Yarns Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Yarn name · ክር</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {yarns.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
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
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td>
                      <strong className="text-brand text-base">{y.name}</strong>
                    </td>
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
                          onSelectYarn(y);
                        }}
                      >
                        Configure
                      </Button>
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
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                Edit yarn · {selectedYarn.name}
              </h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
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

            <Button type="submit" variant="primary" isLoading={saving} style={{ width: "100%" }}>
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <p className="text-muted text-sm">Select a yarn to edit its details</p>
        </Card>
      )}
    </div>
  );
}

export default YarnsTab;
