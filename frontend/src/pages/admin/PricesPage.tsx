import { usePricesManager } from "./prices/usePricesManager";
import { FabricPricesTable } from "./prices/FabricPricesTable";
import { FabricPriceDrawer } from "./prices/FabricPriceDrawer";
import { YarnPricesTable } from "./prices/YarnPricesTable";
import { YarnPriceDrawer } from "./prices/YarnPriceDrawer";
import { SetNewPriceModal } from "./prices/SetNewPriceModal";

export function PricesPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    showClosed,
    setShowClosed,
    fabricPrices,
    yarnPrices,
    setSelectedFabricId,
    selectedFabricItem,
    setSelectedYarnId,
    selectedYarnItem,
    newWeaverRate,
    setNewWeaverRate,
    newSellingPrice,
    setNewSellingPrice,
    takesEffectDate,
    setTakesEffectDate,
    newYarnPurchasePrice,
    setNewYarnPurchasePrice,
    newYarnSellingPrice,
    setNewYarnSellingPrice,
    yarnTakesEffectDate,
    setYarnTakesEffectDate,
    isSaving,
    setIsSaving,
    statusMessage,
    setStatusMessage,
    showNewPriceModal,
    setShowNewPriceModal,
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
    handleSelectFabric,
    handleSelectYarn,
    handleSaveFabricPrice,
    handleSaveYarnPrice,
    filteredFabricPrices,
    filteredYarnPrices,
    loadLiveData,
  } = usePricesManager();

  return (
    <div className="page prices-page">
      {/* ── Page Header ── */}
      <div className="prices-header">
        <h1 className="prices-title">
          Prices <span className="prices-title-amharic">· ዋጋ</span>
        </h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowNewPriceModal(true);
            setStatusMessage("");
          }}
        >
          + Set new price
        </button>
      </div>

      {/* ── Tabs & Search Toolbar ── */}
      <div className="prices-toolbar">
        <div className="tab-bar tab-bar--flush">
          <button
            type="button"
            className={`tab-pill ${tab === "fabricPrices" ? "active" : ""}`}
            onClick={() => {
              setTab("fabricPrices");
              setSearch("");
              setStatusMessage("");
            }}
          >
            Fabric prices
          </button>
          <button
            type="button"
            className={`tab-pill ${tab === "yarnPrices" ? "active" : ""}`}
            onClick={() => {
              setTab("yarnPrices");
              setSearch("");
              setStatusMessage("");
            }}
          >
            Yarn prices
          </button>
        </div>

        <div className="prices-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="prices-search-input"
            placeholder={
              tab === "fabricPrices"
                ? "Search by fabric"
                : "Search by yarn or supplier"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="checkbox-filter-label">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="styled-checkbox"
          />
          Show closed prices
        </label>
      </div>

      {statusMessage && (
        <div className="success-msg mb-4">
          <span>✅</span> {statusMessage}
        </div>
      )}

      {/* ── Tab Content ── */}
      {tab === "fabricPrices" ? (
        <div className={`master-detail ${selectedFabricItem ? "" : "no-panel"}`}>
          <FabricPricesTable
            items={filteredFabricPrices}
            selectedItem={selectedFabricItem}
            showClosed={showClosed}
            onSelect={handleSelectFabric}
          />

          {selectedFabricItem && (
            <FabricPriceDrawer
              item={selectedFabricItem}
              newWeaverRate={newWeaverRate}
              setNewWeaverRate={setNewWeaverRate}
              newSellingPrice={newSellingPrice}
              setNewSellingPrice={setNewSellingPrice}
              takesEffectDate={takesEffectDate}
              setTakesEffectDate={setTakesEffectDate}
              isSaving={isSaving}
              onSave={handleSaveFabricPrice}
              onClose={() => setSelectedFabricId(null)}
              onReset={() => handleSelectFabric(selectedFabricItem)}
            />
          )}
        </div>
      ) : (
        <div className={`master-detail ${selectedYarnItem ? "" : "no-panel"}`}>
          <YarnPricesTable
            items={filteredYarnPrices}
            selectedItem={selectedYarnItem}
            onSelect={handleSelectYarn}
          />

          {selectedYarnItem && (
            <YarnPriceDrawer
              item={selectedYarnItem}
              newYarnPurchasePrice={newYarnPurchasePrice}
              setNewYarnPurchasePrice={setNewYarnPurchasePrice}
              newYarnSellingPrice={newYarnSellingPrice}
              setNewYarnSellingPrice={setNewYarnSellingPrice}
              yarnTakesEffectDate={yarnTakesEffectDate}
              setYarnTakesEffectDate={setYarnTakesEffectDate}
              isSaving={isSaving}
              onSave={handleSaveYarnPrice}
              onClose={() => setSelectedYarnId(null)}
              onReset={() => handleSelectYarn(selectedYarnItem)}
            />
          )}
        </div>
      )}

      {/* ── Modal ── */}
      <SetNewPriceModal
        isOpen={showNewPriceModal}
        tab={tab}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        onClose={() => setShowNewPriceModal(false)}
        fabricPrices={fabricPrices}
        yarnPrices={yarnPrices}
        setStatusMessage={setStatusMessage}
        loadLiveData={loadLiveData}
        newModalFabricName={newModalFabricName}
        setNewModalFabricName={setNewModalFabricName}
        newModalWeaverRate={newModalWeaverRate}
        setNewModalWeaverRate={setNewModalWeaverRate}
        newModalSellingPrice={newModalSellingPrice}
        setNewModalSellingPrice={setNewModalSellingPrice}
        newModalYarnName={newModalYarnName}
        setNewModalYarnName={setNewModalYarnName}
        newModalSupplierName={newModalSupplierName}
        setNewModalSupplierName={setNewModalSupplierName}
        newModalYarnPurchasePrice={newModalYarnPurchasePrice}
        setNewModalYarnPurchasePrice={setNewModalYarnPurchasePrice}
        newModalYarnSellingPrice={newModalYarnSellingPrice}
        setNewModalYarnSellingPrice={setNewModalYarnSellingPrice}
      />
    </div>
  );
}

export default PricesPage;
