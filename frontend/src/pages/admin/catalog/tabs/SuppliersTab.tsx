import React from "react";
import { Badge, Button, Card, FormField } from "../../../../components/common";
import { toTitleCase } from "../../../../utils/formatters";

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
    <div className="master-detail">
      {/* Left Column: Suppliers Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier · አቅራቢ</th>
              <th>Contact phone</th>
              <th>Status</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted catalog-empty-cell">
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
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                  >
                    <td>
                      <strong className="text-brand text-base">{toTitleCase(s.name)}</strong>
                    </td>
                    <td className="text-muted">{s.contactPhone || "—"}</td>
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

      {/* Right Column: Edit Supplier Card */}
      {selectedSupplier ? (
        <Card className="catalog-edit-card">
          <div className="cluster-between catalog-edit-header">
            <div>
              <h3 className="text-lg font-bold">
                Edit supplier · {toTitleCase(selectedSupplier.name)}
              </h3>
              <p className="text-muted text-xs">
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

            <Button type="submit" variant="primary" isLoading={saving} className="btn-full-width">
              Save changes
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="catalog-edit-placeholder">
          <p className="text-muted text-sm">Select a supplier to edit details</p>
        </Card>
      )}
    </div>
  );
}

export default SuppliersTab;
