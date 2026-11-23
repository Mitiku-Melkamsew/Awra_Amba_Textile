import type { YarnPriceItem } from "./types";

export interface YarnPricesTableProps {
  items: YarnPriceItem[];
  selectedItem: YarnPriceItem | null;
  onSelect: (item: YarnPriceItem) => void;
}

export function YarnPricesTable({
  items,
  selectedItem,
  onSelect,
}: YarnPricesTableProps) {
  return (
    <div className="data-table-container">
      <div className="prices-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "20%", whiteSpace: "nowrap" }}>Yarn · ጥጥ</th>
              <th style={{ width: "18%", whiteSpace: "nowrap" }}>Supplier</th>
              <th style={{ width: "16%", textAlign: "right", whiteSpace: "nowrap" }}>Purchase price</th>
              <th style={{ width: "16%", textAlign: "right", whiteSpace: "nowrap" }}>Selling price</th>
              <th style={{ width: "16%", whiteSpace: "nowrap" }}>In effect since</th>
              <th style={{ width: "14%", whiteSpace: "nowrap" }}>Status</th>
              <th style={{ textAlign: "right", whiteSpace: "nowrap" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    color: "var(--text-muted, #64748B)",
                    fontSize: "14px",
                  }}
                >
                  No yarn prices found. Click "+ Set new price" to record official purchase/selling prices.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                    onClick={() => onSelect(item)}
                  >
                    <td>
                      <span className="price-item-name">{item.yarnName}</span>
                    </td>
                    <td style={{ color: "var(--text-muted, #64748B)" }}>{item.supplierName}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {item.purchasePrice.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {item.sellingPrice.toLocaleString()}
                    </td>
                    <td style={{ color: "var(--text-muted, #64748B)", fontSize: "13px" }}>
                      {item.inEffectSince}
                    </td>
                    <td>
                      <span className="badge badge--success">✓ Current</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                      >
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>✏️</span> Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="prices-footnote">
        Purchase price is what you pay the supplier; selling price is what a weaver is charged for yarn. A price belongs to a yarn and a supplier.
      </p>
    </div>
  );
}
