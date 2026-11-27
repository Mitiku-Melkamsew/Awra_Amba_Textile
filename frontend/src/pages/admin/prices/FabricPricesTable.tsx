import { Fragment } from "react";
import type { FabricPriceItem } from "./types";
import { toTitleCase } from "../../../utils/formatters";

export interface FabricPricesTableProps {
  items: FabricPriceItem[];
  selectedItem: FabricPriceItem | null;
  showClosed: boolean;
  onSelect: (item: FabricPriceItem) => void;
}

export function FabricPricesTable({
  items,
  selectedItem,
  showClosed,
  onSelect,
}: FabricPricesTableProps) {
  return (
    <div className="data-table-container">
      <div className="prices-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th className="fabric-col-name">Fabric · ጨርቅ</th>
              <th className="fabric-col-rate">Weaver rate</th>
              <th className="fabric-col-selling">Selling price</th>
              <th className="fabric-col-date">In effect since</th>
              <th className="fabric-col-status">Status</th>
              <th className="fabric-col-action"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted p-8">
                  No fabric prices found. Click "+ Set new price" to record official rates.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;

                return (
                  <Fragment key={item.id}>
                    {/* Current price row */}
                    <tr
                      className={`price-row selectable-row ${isSelected ? "price-row-selected selected" : ""}`}
                      onClick={() => onSelect(item)}
                    >
                      <td>
                        <span className="price-item-name">{toTitleCase(item.name)}</span>
                      </td>
                      <td className="text-right font-bold text-sm">
                        {item.weaverRate.toLocaleString()}
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

                    {/* Earlier price row */}
                    {showClosed && item.earlierPrice && (
                      <tr className="price-earlier-row">
                        <td className="earlier-price-label">Earlier price</td>
                        <td className="text-right text-muted text-xs">
                          {item.earlierPrice.weaverRate?.toLocaleString()}
                        </td>
                        <td className="text-right text-muted text-xs">
                          {item.earlierPrice.sellingPrice?.toLocaleString()}
                        </td>
                        <td className="text-muted text-xs">
                          {item.earlierPrice.period}
                        </td>
                        <td>
                          <span className="badge badge--neutral">Closed</span>
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="prices-footnote">
        Prices are in ETB per piece. Weaver rate is what you pay the weaver; selling price is what a merchant pays.
      </p>
    </div>
  );
}

export default FabricPricesTable;
