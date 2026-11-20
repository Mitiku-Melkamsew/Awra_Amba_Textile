import { Badge } from "../../../../components/common";

export interface SuppliersTabProps {
  suppliers: any[];
}

export function SuppliersTab({ suppliers }: SuppliersTabProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Supplier · አቅራቢ</th>
            <th>Contact phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No suppliers recorded.
              </td>
            </tr>
          ) : (
            suppliers.map((s) => (
              <tr key={s.supplierId}>
                <td className="font-bold">{s.name}</td>
                <td className="text-muted">{s.contactPhone || "—"}</td>
                <td>
                  <Badge variant={s.isActive !== false ? "success" : "neutral"} pill dot>
                    {s.isActive !== false ? "Active" : "Deactivated"}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SuppliersTab;
