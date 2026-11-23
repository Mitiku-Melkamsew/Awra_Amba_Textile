import React from "react";
import { Badge, Button, Card, FormField } from "../../../../components/common";

export interface SuppliersTabProps {
  suppliers: any[];
  selectedSupplier: any | null;
  onSelectSupplier: (s: any) => void;
  editName: string;
  onEditNameChange: (val: string) => void;
  editPhone: string;
  onEditPhoneChange: (val: string) => void;
  onSaveSpecs: (e: React.FormEvent) => Promise<void>;
  onToggleStatus: () => Promise<void>;
  saving: boolean;
}

export function SuppliersTab({
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  editName,
  onEditNameChange,
  editPhone,
  onEditPhoneChange,
  onSaveSpecs,
  onToggleStatus,
  saving,
}: SuppliersTabProps) {
  return (
    <div className="master-detail" style={{ gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
      {/* Left Column: Suppliers Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier · አቅራቢ</th>
              <th>Contact phone</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                  No suppliers recorded.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => {
                const isSelected = selectedSupplier?.supplierId === s.supplierId;
                const isActive = s.isActive !== false;
                return (
                  <tr
                    key={s.supplierId}
                    onClick={() => onSelectSupplier(s)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td>
                      <strong className="text-brand text-base">{s.name}</strong>
                    </td>
                    <td className="text-muted">{s.contactPhone || "—"}</td>
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
                          onSelectSupplier(s);
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

      {/* Right Column: Edit Supplier Card */}
      {selectedSupplier ? (
        <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
          <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                Edit supplier · {selectedSupplier.name}
              </h3>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                Update vendor details and status
              </p>
            </div>
            <Button
              variant={selectedSupplier.isActive !== false ? "danger" : "secondary"}
              size="sm"
              onClick={onToggleStatus}
              isLoading={saving}
            >
              {selectedSupplier.isActive !== false ? "Deactivate" : "Reactivate"}
            </Button>
          </div>

          <form onSubmit={onSaveSpecs} className="stack">
            <FormField label="Supplier name · የአቅራቢ ስም" required>
              <input
                type="text"
                className="input"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Contact phone · ስልክ ቁጥር">
              <input
                type="text"
                className="input"
                value={editPhone}
                onChange={(e) => onEditPhoneChange(e.target.value)}
                placeholder="09..."
              />
            </FormField>

            <Button type="submit" variant="primary" isLoading={saving} style={{ width: "100%" }}>
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: "var(--space-6)", textAlign: "center" }}>
          <p className="text-muted text-sm">Select a supplier to edit details</p>
        </Card>
      )}
    </div>
  );
}

export default SuppliersTab;
