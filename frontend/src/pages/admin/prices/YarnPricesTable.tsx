import type { YarnPriceItem } from "./types";
import { toTitleCase } from "../../../utils/formatters";

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
              <th className="yarn-col-name">Yarn · ጥጥ</th>
              <th className="yarn-col-supplier">Supplier</th>
              <th className="yarn-col-purchase">Purchase price</th>
              <th className="yarn-col-selling">Selling price</th>
              <th className="yarn-col-date">In effect since</th>
              <th className="yarn-col-status">Status</th>
              <th className="yarn-col-action"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted p-8">
                  No yarn prices found. Click "+ Set new price" to record official purchase/selling prices.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`price-row selectable-row ${isSelected ? "price-row-selected selected" : ""}`}
                    onClick={() => onSelect(item)}
                  >
                    <td>
                      <span className="price-item-name">{toTitleCase(item.yarnName)}</span>
                    </td>
                    <td className="text-muted">{toTitleCase(item.supplierName)}</td>
                    <td className="text-right font-bold text-sm">
                      {item.purchasePrice.toLocaleString()}
                    </td>
                    <td className="text-right font-bold text-sm">
                      {item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="text-muted text-xs">
                      {item.inEffectSince}
                    </td>
                    <td>
                      <span className="badge badge--success">✓ Current</span>
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

      <p className="prices-footnote">
        Purchase price is what you pay the supplier; selling price is what a weaver is charged for yarn. A price belongs to a yarn and a supplier.
      </p>
    </div>
  );
}

export default YarnPricesTable;
