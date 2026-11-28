import { CreateVariantModal } from "../pages/admin/transactions/components/CreateVariantModal";
import type { CreateFabricVariantController } from "./useCreateFabricVariant";

export interface AddFabricVariantModalProps {
  controller: CreateFabricVariantController;
}

export function AddFabricVariantModal({ controller }: AddFabricVariantModalProps) {
  return (
    <CreateVariantModal
      isOpen={controller.isOpen}
      onClose={controller.close}
      isFabric={true}
      variantModalError={controller.variantModalError}
      savingVariant={controller.savingVariant}
      onSaveNewVariant={controller.handleSaveNewVariant}
      fabrics={controller.fabrics}
      yarns={[]}
      colors={controller.colors}
      designs={controller.designs}
      suppliers={[]}
      newFvFabricId={controller.newFvFabricId}
      setNewFvFabricId={controller.setNewFvFabricId}
      newFvWarpColorId={controller.newFvWarpColorId}
      setNewFvWarpColorId={controller.setNewFvWarpColorId}
      newFvWeftColorId={controller.newFvWeftColorId}
      setNewFvWeftColorId={controller.setNewFvWeftColorId}
      newFvDesignId={controller.newFvDesignId}
      setNewFvDesignId={controller.setNewFvDesignId}
      newYvYarnId=""
      setNewYvYarnId={() => {}}
      newYvColorId=""
      setNewYvColorId={() => {}}
      newYvSupplierId=""
      setNewYvSupplierId={() => {}}
      showNewFabricForm={controller.showNewFabricForm}
      setShowNewFabricForm={controller.setShowNewFabricForm}
      inlineFabricName={controller.inlineFabricName}
      setInlineFabricName={controller.setInlineFabricName}
      inlineFabricWeight={controller.inlineFabricWeight}
      setInlineFabricWeight={controller.setInlineFabricWeight}
      inlineFabricLength={controller.inlineFabricLength}
      setInlineFabricLength={controller.setInlineFabricLength}
      inlineFabricWidth={controller.inlineFabricWidth}
      setInlineFabricWidth={controller.setInlineFabricWidth}
      handleCreateInlineFabric={controller.handleCreateInlineFabric}
      showNewWarpColorForm={controller.showNewWarpColorForm}
      setShowNewWarpColorForm={controller.setShowNewWarpColorForm}
      inlineWarpColorName={controller.inlineWarpColorName}
      setInlineWarpColorName={controller.setInlineWarpColorName}
      handleCreateInlineWarpColor={controller.handleCreateInlineWarpColor}
      showNewWeftColorForm={controller.showNewWeftColorForm}
      setShowNewWeftColorForm={controller.setShowNewWeftColorForm}
      inlineWeftColorName={controller.inlineWeftColorName}
      setInlineWeftColorName={controller.setInlineWeftColorName}
      handleCreateInlineWeftColor={controller.handleCreateInlineWeftColor}
      showNewDesignForm={controller.showNewDesignForm}
      setShowNewDesignForm={controller.setShowNewDesignForm}
      inlineDesignName={controller.inlineDesignName}
      setInlineDesignName={controller.setInlineDesignName}
      handleCreateInlineDesign={controller.handleCreateInlineDesign}
      showNewYarnForm={false}
      setShowNewYarnForm={() => {}}
      inlineYarnName=""
      setInlineYarnName={() => {}}
      handleCreateInlineYarn={async () => {}}
      showNewYarnColorForm={false}
      setShowNewYarnColorForm={() => {}}
      inlineYarnColorName=""
      setInlineYarnColorName={() => {}}
      handleCreateInlineYarnColor={async () => {}}
      showNewSupplierForm={false}
      setShowNewSupplierForm={() => {}}
      inlineSupplierName=""
      setInlineSupplierName={() => {}}
      inlineSupplierPhone=""
      setInlineSupplierPhone={() => {}}
      handleCreateInlineSupplier={async () => {}}
    />
  );
}
