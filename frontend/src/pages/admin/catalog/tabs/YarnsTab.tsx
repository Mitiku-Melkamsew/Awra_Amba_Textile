import { Badge } from "../../../../components/common";

export interface YarnsTabProps {
  yarns: any[];
}

export function YarnsTab({ yarns }: YarnsTabProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Yarn name · ክር</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {yarns.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No yarns recorded.
              </td>
            </tr>
          ) : (
            yarns.map((y) => (
              <tr key={y.yarnId}>
                <td className="font-bold">{y.name}</td>
                <td>
                  <Badge variant={y.isActive !== false ? "success" : "neutral"} pill dot>
                    {y.isActive !== false ? "Active" : "Deactivated"}
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

export default YarnsTab;
