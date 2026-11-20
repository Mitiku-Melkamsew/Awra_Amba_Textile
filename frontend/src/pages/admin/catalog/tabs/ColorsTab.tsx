export interface ColorsTabProps {
  colors: any[];
}

export function ColorsTab({ colors }: ColorsTabProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Color name · ቀለም</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {colors.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No colors recorded.
              </td>
            </tr>
          ) : (
            colors.map((c) => (
              <tr key={c.colorId}>
                <td className="font-bold">{c.name}</td>
                <td className="text-muted">#{c.colorId}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ColorsTab;
