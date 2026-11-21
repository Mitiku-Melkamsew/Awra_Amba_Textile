import type { FormEvent } from "react";
import type { YarnPriceItem } from "./types";

export interface YarnPriceDrawerProps {
  item: YarnPriceItem;
  newYarnPurchasePrice: string;
  setNewYarnPurchasePrice: (val: string) => void;
  newYarnSellingPrice: string;
  setNewYarnSellingPrice: (val: string) => void;
  yarnTakesEffectDate: string;
  setYarnTakesEffectDate: (val: string) => void;
  isSaving: boolean;
  onSave: (e: FormEvent) => void;
  onClose: () => void;
  onReset: () => void;
}

export function YarnPriceDrawer({
  item,
  newYarnPurchasePrice,
  setNewYarnPurchasePrice,
  newYarnSellingPrice,
  setNewYarnSellingPrice,
  yarnTakesEffectDate,
  setYarnTakesEffectDate,
  isSaving,
  onSave,
  onClose,
  onReset,
}: YarnPriceDrawerProps) {
  const currentYarnPurchase = item.purchasePrice;
  const currentYarnSelling = item.sellingPrice;
  const numNewYarnPurchase = parseFloat(newYarnPurchasePrice) || 0;
  const diffYarnPurchase = numNewYarnPurchase - currentYarnPurchase;
  const numNewYarnSelling = parseFloat(newYarnSellingPrice) || 0;
  const diffYarnSelling = numNewYarnSelling - currentYarnSelling;

  return (
    <div className="price-edit-panel">
      <div className="price-edit-header">
        <div>
          <h3 className="price-edit-title">Change price</h3>
          <div className="price-edit-fabric-name">{item.yarnName}</div>
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
          Now: purchase <strong>{item.purchasePrice.toLocaleString()}</strong> · selling{" "}
          <strong>{item.sellingPrice.toLocaleString()}</strong>
        </div>
        <div className="price-now-sub">
          Supplier: {item.supplierName} · Since {item.inEffectSince}
        </div>
      </div>

      <form onSubmit={onSave}>
        {/* Purchase Price Field */}
        <div className="price-form-group">
          <label className="price-form-label">New purchase price (ETB)</label>
          <input
            type="number"
            step="any"
            min="0"
            className="price-form-input"
            value={newYarnPurchasePrice}
            onChange={(e) => setNewYarnPurchasePrice(e.target.value)}
            required
          />
          <div className="price-delta-badge" style={{ fontSize: "12px", marginTop: "4px" }}>
            {diffYarnPurchase === 0 ? (
              <span style={{ color: "var(--text-muted)" }}>No change</span>
            ) : diffYarnPurchase > 0 ? (
              <span style={{ color: "var(--brand, #C2410C)", fontWeight: 600 }}>
                ↑ Up {diffYarnPurchase}
              </span>
            ) : (
              <span style={{ color: "var(--blue, #0284C7)", fontWeight: 600 }}>
                ↓ Down {Math.abs(diffYarnPurchase)}
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
            value={newYarnSellingPrice}
            onChange={(e) => setNewYarnSellingPrice(e.target.value)}
            required
          />
          <div className="price-delta-badge" style={{ fontSize: "12px", marginTop: "4px" }}>
            {diffYarnSelling === 0 ? (
              <span style={{ color: "var(--text-muted)" }}>No change</span>
            ) : diffYarnSelling > 0 ? (
              <span style={{ color: "var(--brand, #C2410C)", fontWeight: 600 }}>
                ↑ Up {diffYarnSelling}
              </span>
            ) : (
              <span style={{ color: "var(--blue, #0284C7)", fontWeight: 600 }}>
                ↓ Down {Math.abs(diffYarnSelling)}
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
            value={yarnTakesEffectDate}
            onChange={(e) => setYarnTakesEffectDate(e.target.value)}
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
