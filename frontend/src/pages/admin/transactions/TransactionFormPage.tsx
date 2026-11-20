import { Link } from "react-router-dom";
import { useTransactionForm } from "./components/useTransactionForm";
import { TransactionCategoryPicker } from "./components/TransactionCategoryPicker";
import { TransactionCounterpartySection } from "./components/TransactionCounterpartySection";
import { TransactionLineItemsTable } from "./components/TransactionLineItemsTable";
import { TransactionSummarySidebar } from "./components/TransactionSummarySidebar";
import { CreateCounterpartyModal } from "./components/CreateCounterpartyModal";
import { CreateVariantModal } from "./components/CreateVariantModal";

export function TransactionFormPage() {
  const txn = useTransactionForm();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "1.5rem 2rem 3rem",
      }}
    >
      {/* Back Link */}
      <div style={{ marginBottom: "0.5rem" }}>
        <Link
          to="/admin/transactions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--color-primary, #c2410c)",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <span>&lt;</span> Transactions
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-text-muted, #94a3b8)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          ግብይት · NEW TRANSACTION
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--color-text, #0f172a)",
            letterSpacing: "-0.02em",
          }}
        >
          New transaction
        </h1>
      </div>

      {/* 4 Top Category Cards */}
      <TransactionCategoryPicker
        category={txn.category}
        onSelectCategory={txn.handleCategoryChange}
      />

      {/* Error banner */}
      {txn.error && (
        <div
          style={{
            background: "var(--color-danger-subtle, #fef2f2)",
            border: "1px solid var(--color-danger-border, #fecaca)",
            color: "var(--color-danger-dark, #991b1b)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm, 8px)",
            marginBottom: "1.25rem",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>⚠️</span> {txn.error}
        </div>
      )}

      {/* 2-Column Form Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Counterparty, Line Items Table & Date/Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <TransactionCounterpartySection
            category={txn.category}
            merchantUserId={txn.merchantUserId}
            setMerchantUserId={txn.setMerchantUserId}
            weaverUserId={txn.weaverUserId}
            setWeaverUserId={txn.setWeaverUserId}
            merchants={txn.merchants}
            weavers={txn.weavers}
            onOpenAddPartyModal={(initialName) => {
              if (initialName) txn.setNewPartyName(initialName);
              txn.setShowAddPartyModal(true);
            }}
            date={txn.date}
            setDate={txn.setDate}
            notes={txn.notes}
            setNotes={txn.setNotes}
          />

          <TransactionLineItemsTable
            isFabric={txn.isFabric}
            isSale={txn.isSale}
            category={txn.category}
            lines={txn.lines}
            fabricVariants={txn.fabricVariants}
            yarnVariants={txn.yarnVariants}
            handleUpdateLine={txn.handleUpdateLine}
            handleRemoveLine={txn.handleRemoveLine}
            handleAddLine={txn.handleAddLine}
            handleOpenAddVariantModal={txn.handleOpenAddVariantModal}
          />
        </div>

        {/* Right Column: Sticky Summary Sidebar */}
        <TransactionSummarySidebar
          category={txn.category}
          categoryLabel={txn.categoryLabel}
          counterpartySummaryName={txn.counterpartySummaryName}
          date={txn.date}
          linesCount={txn.lines.length}
          totalQuantity={txn.totalQuantity}
          calculatedGrandTotal={txn.calculatedGrandTotal}
          saving={txn.saving}
          onSaveTransaction={txn.handleSaveTransaction}
        />
      </div>

      {/* Quick Add Party Modal */}
      <CreateCounterpartyModal
        isOpen={txn.showAddPartyModal}
        onClose={() => txn.setShowAddPartyModal(false)}
        category={txn.category}
        newPartyName={txn.newPartyName}
        setNewPartyName={txn.setNewPartyName}
        newPartyPhone={txn.newPartyPhone}
        setNewPartyPhone={txn.setNewPartyPhone}
        onSubmit={txn.handleQuickAddParty}
      />

      {/* Quick Add Variant Modal */}
      <CreateVariantModal
        isOpen={txn.showAddVariantModal}
        onClose={() => txn.setShowAddVariantModal(false)}
        isFabric={txn.isFabric}
        variantModalError={txn.variantModalError}
        savingVariant={txn.savingVariant}
        onSaveNewVariant={txn.handleSaveNewVariant}
        fabrics={txn.fabrics}
        yarns={txn.yarns}
        colors={txn.colors}
        designs={txn.designs}
        suppliers={txn.suppliers}
        newFvFabricId={txn.newFvFabricId}
        setNewFvFabricId={txn.setNewFvFabricId}
        newFvWarpColorId={txn.newFvWarpColorId}
        setNewFvWarpColorId={txn.setNewFvWarpColorId}
        newFvWeftColorId={txn.newFvWeftColorId}
        setNewFvWeftColorId={txn.setNewFvWeftColorId}
        newFvDesignId={txn.newFvDesignId}
        setNewFvDesignId={txn.setNewFvDesignId}
        newFvSku={txn.newFvSku}
        setNewFvSku={txn.setNewFvSku}
        newYvYarnId={txn.newYvYarnId}
        setNewYvYarnId={txn.setNewYvYarnId}
        newYvColorId={txn.newYvColorId}
        setNewYvColorId={txn.setNewYvColorId}
        newYvSupplierId={txn.newYvSupplierId}
        setNewYvSupplierId={txn.setNewYvSupplierId}
        newYvSku={txn.newYvSku}
        setNewYvSku={txn.setNewYvSku}
        showNewFabricForm={txn.showNewFabricForm}
        setShowNewFabricForm={txn.setShowNewFabricForm}
        inlineFabricName={txn.inlineFabricName}
        setInlineFabricName={txn.setInlineFabricName}
        inlineFabricWeight={txn.inlineFabricWeight}
        setInlineFabricWeight={txn.setInlineFabricWeight}
        inlineFabricLength={txn.inlineFabricLength}
        setInlineFabricLength={txn.setInlineFabricLength}
        inlineFabricWidth={txn.inlineFabricWidth}
        setInlineFabricWidth={txn.setInlineFabricWidth}
        handleCreateInlineFabric={txn.handleCreateInlineFabric}
        showNewWarpColorForm={txn.showNewWarpColorForm}
        setShowNewWarpColorForm={txn.setShowNewWarpColorForm}
        inlineWarpColorName={txn.inlineWarpColorName}
        setInlineWarpColorName={txn.setInlineWarpColorName}
        handleCreateInlineWarpColor={txn.handleCreateInlineWarpColor}
        showNewWeftColorForm={txn.showNewWeftColorForm}
        setShowNewWeftColorForm={txn.setShowNewWeftColorForm}
        inlineWeftColorName={txn.inlineWeftColorName}
        setInlineWeftColorName={txn.setInlineWeftColorName}
        handleCreateInlineWeftColor={txn.handleCreateInlineWeftColor}
        showNewDesignForm={txn.showNewDesignForm}
        setShowNewDesignForm={txn.setShowNewDesignForm}
        inlineDesignName={txn.inlineDesignName}
        setInlineDesignName={txn.setInlineDesignName}
        handleCreateInlineDesign={txn.handleCreateInlineDesign}
        showNewYarnForm={txn.showNewYarnForm}
        setShowNewYarnForm={txn.setShowNewYarnForm}
        inlineYarnName={txn.inlineYarnName}
        setInlineYarnName={txn.setInlineYarnName}
        handleCreateInlineYarn={txn.handleCreateInlineYarn}
        showNewYarnColorForm={txn.showNewYarnColorForm}
        setShowNewYarnColorForm={txn.setShowNewYarnColorForm}
        inlineYarnColorName={txn.inlineYarnColorName}
        setInlineYarnColorName={txn.setInlineYarnColorName}
        handleCreateInlineYarnColor={txn.handleCreateInlineYarnColor}
        showNewSupplierForm={txn.showNewSupplierForm}
        setShowNewSupplierForm={txn.setShowNewSupplierForm}
        inlineSupplierName={txn.inlineSupplierName}
        setInlineSupplierName={txn.setInlineSupplierName}
        inlineSupplierPhone={txn.inlineSupplierPhone}
        setInlineSupplierPhone={txn.setInlineSupplierPhone}
        handleCreateInlineSupplier={txn.handleCreateInlineSupplier}
      />
    </div>
  );
}

export default TransactionFormPage;
