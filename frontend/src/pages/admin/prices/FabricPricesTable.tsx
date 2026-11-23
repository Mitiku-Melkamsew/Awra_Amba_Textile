import { Fragment } from "react";
import type { FabricPriceItem } from "./types";

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
              <th style={{ width: "24%" }}>Fabric · ጨርቅ</th>
              <th style={{ width: "18%", textAlign: "right" }}>Weaver rate</th>
              <th style={{ width: "18%", textAlign: "right" }}>Selling price</th>
              <th style={{ width: "16%" }}>In effect since</th>
              <th style={{ width: "12%" }}>Status</th>
              <th style={{ width: "12%", textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <Fragment key={item.id}>
                  {/* Current price row */}
                  <tr
                    className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                    onClick={() => onSelect(item)}
                  >
                    <td>
                      <span className="price-item-name">{item.name}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                      {item.weaverRate.toLocaleString()}
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

                  {/* Earlier price row */}
                  {showClosed && item.earlierPrice && (
                    <tr className="price-earlier-row">
                      <td className="earlier-price-label">Earlier price</td>
                      <td style={{ textAlign: "right", color: "var(--text-muted, #64748B)", fontSize: "13px" }}>
                        {item.earlierPrice.weaverRate?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-muted, #64748B)", fontSize: "13px" }}>
                        {item.earlierPrice.sellingPrice?.toLocaleString()}
                      </td>
                      <td style={{ color: "var(--text-muted, #64748B)", fontSize: "12px" }}>
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
            })}
          </tbody>
        </table>
      </div>

      <p className="prices-footnote">
        Prices are in ETB per piece. Weaver rate is what you pay the weaver; selling price is what a merchant pays.
      </p>
    </div>
  );
}
