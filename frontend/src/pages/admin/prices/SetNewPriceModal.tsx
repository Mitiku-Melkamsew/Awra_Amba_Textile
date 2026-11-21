import { type FormEvent } from "react";
import { catalogApi } from "../../../api";
import type { FabricPriceItem, YarnPriceItem } from "./types";

export interface SetNewPriceModalProps {
  isOpen: boolean;
  tab: "fabricPrices" | "yarnPrices";
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  onClose: () => void;
  fabricPrices: FabricPriceItem[];
  yarnPrices: YarnPriceItem[];
  setStatusMessage: (msg: string) => void;
  loadLiveData: () => Promise<void>;
  newModalFabricName: string;
  setNewModalFabricName: (val: string) => void;
  newModalWeaverRate: string;
  setNewModalWeaverRate: (val: string) => void;
  newModalSellingPrice: string;
  setNewModalSellingPrice: (val: string) => void;
  newModalYarnName: string;
  setNewModalYarnName: (val: string) => void;
  newModalSupplierName: string;
  setNewModalSupplierName: (val: string) => void;
  newModalYarnPurchasePrice: string;
  setNewModalYarnPurchasePrice: (val: string) => void;
  newModalYarnSellingPrice: string;
  setNewModalYarnSellingPrice: (val: string) => void;
}

export function SetNewPriceModal({
  isOpen,
  tab,
  isSaving,
  setIsSaving,
  onClose,
  fabricPrices,
  yarnPrices,
  setStatusMessage,
  loadLiveData,
  newModalFabricName,
  setNewModalFabricName,
  newModalWeaverRate,
  setNewModalWeaverRate,
  newModalSellingPrice,
  setNewModalSellingPrice,
  newModalYarnName,
  setNewModalYarnName,
  newModalSupplierName,
  setNewModalSupplierName,
  newModalYarnPurchasePrice,
  setNewModalYarnPurchasePrice,
  newModalYarnSellingPrice,
  setNewModalYarnSellingPrice,
}: SetNewPriceModalProps) {
  if (!isOpen) return null;

  async function handleCreateFabric(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const matched = fabricPrices.find(
        (f) => f.name.toLowerCase() === newModalFabricName.trim().toLowerCase()
      );
      if (matched?.fabricId) {
        await catalogApi.createFabricPrice({
          fabricId: matched.fabricId,
          weaverRate: parseFloat(newModalWeaverRate),
          sellingPrice: parseFloat(newModalSellingPrice),
          effectiveFrom: new Date().toISOString(),
        });
      }
      onClose();
      setNewModalFabricName("");
      setNewModalWeaverRate("");
      setNewModalSellingPrice("");
      setStatusMessage("New fabric price created.");
      await loadLiveData();
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to create price");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateYarn(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const matched = yarnPrices.find(
        (y) =>
          y.yarnName.toLowerCase().includes(newModalYarnName.trim().toLowerCase()) ||
          y.supplierName.toLowerCase().includes(newModalSupplierName.trim().toLowerCase())
      );
      if (matched?.yarnId && matched?.supplierId) {
        await catalogApi.createYarnPrice({
          yarnId: matched.yarnId,
          supplierId: matched.supplierId,
          purchasePrice: parseFloat(newModalYarnPurchasePrice),
          sellingPrice: parseFloat(newModalYarnSellingPrice),
          effectiveFrom: new Date().toISOString(),
        });
      }
      onClose();
      setNewModalYarnName("");
      setNewModalSupplierName("");
      setNewModalYarnPurchasePrice("");
      setNewModalYarnSellingPrice("");
      setStatusMessage("New yarn price schedule created.");
      await loadLiveData();
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to create yarn price");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        {tab === "fabricPrices" ? (
          <>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">+ Set new fabric price</h2>
                <p className="modal-sub">Create a new price schedule for a fabric</p>
              </div>
              <button
                type="button"
                className="detail-close-btn"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateFabric}>
                <div className="price-form-group">
                  <label className="price-form-label">Fabric Name</label>
                  <input
                    type="text"
                    className="price-form-input"
                    placeholder="e.g. medebegna, gabi, netela..."
                    value={newModalFabricName}
                    onChange={(e) => setNewModalFabricName(e.target.value)}
                    required
                  />
                </div>

                <div className="price-form-group" style={{ marginTop: "1rem" }}>
                  <label className="price-form-label">Weaver Rate (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    placeholder="e.g. 1380"
                    value={newModalWeaverRate}
                    onChange={(e) => setNewModalWeaverRate(e.target.value)}
                    required
                  />
                </div>

                <div className="price-form-group" style={{ marginTop: "1rem" }}>
                  <label className="price-form-label">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    placeholder="e.g. 1900"
                    value={newModalSellingPrice}
                    onChange={(e) => setNewModalSellingPrice(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? "Creating..." : "Create fabric price"}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">+ Set new yarn price</h2>
                <p className="modal-sub">
                  Create a new purchase and selling price for a yarn
                </p>
              </div>
              <button
                type="button"
                className="detail-close-btn"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateYarn}>
                <div className="price-form-group">
                  <label className="price-form-label">Yarn Name</label>
                  <input
                    type="text"
                    className="price-form-input"
                    placeholder="e.g. cotton · white, silk · red..."
                    value={newModalYarnName}
                    onChange={(e) => setNewModalYarnName(e.target.value)}
                    required
                  />
                </div>

                <div className="price-form-group" style={{ marginTop: "1rem" }}>
                  <label className="price-form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="price-form-input"
                    placeholder="e.g. Supplier A, Supplier B..."
                    value={newModalSupplierName}
                    onChange={(e) => setNewModalSupplierName(e.target.value)}
                    required
                  />
                </div>

                <div className="price-form-group" style={{ marginTop: "1rem" }}>
                  <label className="price-form-label">Purchase Price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    placeholder="e.g. 410"
                    value={newModalYarnPurchasePrice}
                    onChange={(e) => setNewModalYarnPurchasePrice(e.target.value)}
                    required
                  />
                </div>

                <div className="price-form-group" style={{ marginTop: "1rem" }}>
                  <label className="price-form-label">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    placeholder="e.g. 520"
                    value={newModalYarnSellingPrice}
                    onChange={(e) => setNewModalYarnSellingPrice(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? "Creating..." : "Create yarn price"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
