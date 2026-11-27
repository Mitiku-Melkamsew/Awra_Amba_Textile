import type { FormEvent } from "react";
import type { FabricPriceItem } from "./types";

export interface FabricPriceDrawerProps {
  item: FabricPriceItem;
  newWeaverRate: string;
  setNewWeaverRate: (val: string) => void;
  newSellingPrice: string;
  setNewSellingPrice: (val: string) => void;
  takesEffectDate: string;
  setTakesEffectDate: (val: string) => void;
  isSaving: boolean;
  onSave: (e: FormEvent) => void;
  onClose: () => void;
  onReset: () => void;
}

export function FabricPriceDrawer({
  item,
  newWeaverRate,
  setNewWeaverRate,
  newSellingPrice,
  setNewSellingPrice,
  takesEffectDate,
  setTakesEffectDate,
  isSaving,
  onSave,
  onClose,
  onReset,
}: FabricPriceDrawerProps) {
  const currentWeaverRate = item.weaverRate;
  const currentSellingPrice = item.sellingPrice;
  const numNewWeaver = parseFloat(newWeaverRate) || 0;
  const diffWeaver = numNewWeaver - currentWeaverRate;
  const pctWeaver =
    currentWeaverRate > 0 ? ((diffWeaver / currentWeaverRate) * 100).toFixed(1) : 0;
  const numNewSelling = parseFloat(newSellingPrice) || 0;
  const diffSelling = numNewSelling - currentSellingPrice;

  return (
    <div className="price-edit-panel">
      <div className="price-edit-header">
        <div>
          <h3 className="price-edit-title">Change price</h3>
          <div className="price-edit-fabric-name">{item.name}</div>
        </div>
        <button
          type="button"
          className="detail-close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="price-now-banner">
        <div className="price-now-line">
          Now: weaver rate <strong>{item.weaverRate.toLocaleString()}</strong> · selling price{" "}
          <strong>{item.sellingPrice.toLocaleString()}</strong>
        </div>
        <div className="price-now-sub">In effect since {item.inEffectSince}</div>
      </div>

      <form onSubmit={onSave}>
        {/* Weaver Rate Field */}
        <div className="price-form-group">
          <label className="price-form-label">New weaver rate (ETB)</label>
          <input
            type="number"
            step="any"
            min="0"
            className="price-form-input"
            value={newWeaverRate}
            onChange={(e) => setNewWeaverRate(e.target.value)}
            required
          />
          <div className="price-delta-badge">
            {diffWeaver === 0 ? (
              <span className="delta-no-change">No change</span>
            ) : diffWeaver > 0 ? (
              <span className="delta-up">
                ↑ Up {diffWeaver} ({pctWeaver}%)
              </span>
            ) : (
              <span className="delta-down">
                ↓ Down {Math.abs(diffWeaver)} ({Math.abs(Number(pctWeaver))}%)
              </span>
            )}
          </div>
        </div>

        {/* Selling Price Field */}
        <div className="price-form-group">
          <label className="price-form-label">New selling price (ETB)</label>
          <input
            type="number"
            step="any"
            min="0"
            className="price-form-input"
            value={newSellingPrice}
            onChange={(e) => setNewSellingPrice(e.target.value)}
            required
          />
          <div className="price-delta-badge">
            {diffSelling === 0 ? (
              <span className="delta-no-change">No change</span>
            ) : diffSelling > 0 ? (
              <span className="delta-up">
                ↑ Up {diffSelling}
              </span>
            ) : (
              <span className="delta-down">
                ↓ Down {Math.abs(diffSelling)}
              </span>
            )}
          </div>
        </div>

        {/* Takes Effect On */}
        <div className="price-form-group">
          <label className="price-form-label">Takes effect on</label>
          <input
            type="text"
            className="price-form-input"
            value={takesEffectDate}
            onChange={(e) => setTakesEffectDate(e.target.value)}
            required
          />
        </div>

        {/* Buttons */}
        <div className="price-edit-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save new price"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-full-width"
            onClick={onReset}
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="price-edit-footnote">
        The current price ends when the new one starts. Records already saved keep the price they were saved with.
      </p>
    </div>
  );
}
