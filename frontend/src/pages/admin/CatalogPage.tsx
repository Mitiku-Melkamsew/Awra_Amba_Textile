import { useState } from "react";
import { Alert, Button, PageHeader } from "../../components/common";
import { useCatalogData, type CatalogTab } from "./catalog/useCatalogData";
import { FabricsTab } from "./catalog/tabs/FabricsTab";
import { FabricVariantsTab } from "./catalog/tabs/FabricVariantsTab";
import { YarnsTab } from "./catalog/tabs/YarnsTab";
import { YarnVariantsTab } from "./catalog/tabs/YarnVariantsTab";
import { ColorsTab } from "./catalog/tabs/ColorsTab";
import { DesignsTab } from "./catalog/tabs/DesignsTab";
import { SuppliersTab } from "./catalog/tabs/SuppliersTab";
import { AddCatalogItemModal } from "./catalog/AddCatalogItemModal";

const TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "fabrics", label: "Fabrics (ጨርቆች)" },
  { key: "fabricVariants", label: "Fabric types (የጨርቅ አይነቶች)" },
  { key: "yarns", label: "Yarns (ክሮች)" },
  { key: "yarnVariants", label: "Yarn types (የክር አይነቶች)" },
  { key: "colors", label: "Colors (ቀለሞች)" },
  { key: "designs", label: "Designs (ጥበቦች)" },
  { key: "suppliers", label: "Suppliers (አቅራቢዎች)" },
];

export function CatalogPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    showDeactivated,
    setShowDeactivated,
    fabrics,
    fabricVariants,
    yarns,
    yarnVariants,
    colors,
    designs,
    suppliers,
    selectedFabric,
    handleSelectFabric,
    editWeight,
    setEditWeight,
    editLength,
    setEditLength,
    editWidth,
    setEditWidth,
    handleSaveFabricSpecs,
    handleToggleFabricStatus,
    saving,
    statusMessage,
    setStatusMessage,
    errorMessage,
    setErrorMessage,
    loadAllData,
  } = useCatalogData();

  const [showAddModal, setShowAddModal] = useState(false);

  // Filter fabrics by search & deactivated
  const q = search.toLowerCase().trim();
  const displayedFabrics = fabrics.filter((f) => {
    if (!showDeactivated && !f.isActive) return false;
    if (!q) return true;
    return f.name.toLowerCase().includes(q);
  });

  const getAddButtonLabel = () => {
    switch (tab) {
      case "fabrics": return "+ Add fabric";
      case "fabricVariants": return "+ Add fabric type";
      case "yarns": return "+ Add yarn";
      case "yarnVariants": return "+ Add yarn type";
      case "colors": return "+ Add color";
      case "designs": return "+ Add design";
      case "suppliers": return "+ Add supplier";
    }
  };

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="ማውጫ · CATALOG"
        title="Cooperative Catalog"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            {getAddButtonLabel()}
          </Button>
        }
      />

      {/* Global Alerts */}
      {statusMessage && (
        <Alert variant="success" onClose={() => setStatusMessage("")}>
          {statusMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* ── Controls: Search & Deactivated Toggle ── */}
      <div className="cluster-between" style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ maxWidth: 360, width: "100%" }}>
          <input
            type="text"
            className="input"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="cluster" style={{ cursor: "pointer", fontSize: "var(--text-sm)" }}>
          <input
            type="checkbox"
            checked={showDeactivated}
            onChange={(e) => setShowDeactivated(e.target.checked)}
            style={{ accentColor: "var(--brand)" }}
          />
          <span className="text-muted">Show deactivated</span>
        </label>
      </div>

      {/* ── Horizontal Navigation Tabs ── */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-pill ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Active Tab Content ── */}
      {tab === "fabrics" && (
        <FabricsTab
          fabrics={displayedFabrics}
          selectedFabric={selectedFabric}
          onSelectFabric={handleSelectFabric}
          editWeight={editWeight}
          onEditWeightChange={setEditWeight}
          editLength={editLength}
          onEditLengthChange={setEditLength}
          editWidth={editWidth}
          onEditWidthChange={setEditWidth}
          onSaveSpecs={handleSaveFabricSpecs}
          onToggleStatus={handleToggleFabricStatus}
          saving={saving}
        />
      )}

      {tab === "fabricVariants" && (
        <FabricVariantsTab
          variants={fabricVariants}
          showDeactivated={showDeactivated}
        />
      )}

      {tab === "yarns" && <YarnsTab yarns={yarns} />}

      {tab === "yarnVariants" && <YarnVariantsTab variants={yarnVariants} />}

      {tab === "colors" && <ColorsTab colors={colors} />}

      {tab === "designs" && <DesignsTab designs={designs} />}

      {tab === "suppliers" && <SuppliersTab suppliers={suppliers} />}

      {/* ── Unified Add Item Dialog ── */}
      <AddCatalogItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        activeTab={tab}
        fabrics={fabrics}
        fabricVariants={fabricVariants}
        yarns={yarns}
        yarnVariants={yarnVariants}
        colors={colors}
        designs={designs}
        suppliers={suppliers}
        onItemCreated={(msg) => setStatusMessage(msg)}
        onRefreshData={loadAllData}
      />
    </div>
  );
}

export default CatalogPage;
