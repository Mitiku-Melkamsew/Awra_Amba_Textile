export interface DesignsTabProps {
  designs: any[];
}

export function DesignsTab({ designs }: DesignsTabProps) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Design pattern · ጥበብ/ስልት</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {designs.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                No designs recorded.
              </td>
            </tr>
          ) : (
            designs.map((d) => (
              <tr key={d.designId}>
                <td className="font-bold">{d.name}</td>
                <td className="text-muted">#{d.designId}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DesignsTab;
