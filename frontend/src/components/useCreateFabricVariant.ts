import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  catalogApi,
  type Color,
  type Design,
  type Fabric,
  type FabricVariant,
} from "../api";

export interface UseCreateFabricVariantArgs {
  fabrics: Fabric[];
  setFabrics: Dispatch<SetStateAction<Fabric[]>>;
  colors: Color[];
  setColors: Dispatch<SetStateAction<Color[]>>;
  designs: Design[];
  setDesigns: Dispatch<SetStateAction<Design[]>>;
  setFabricVariants: Dispatch<SetStateAction<FabricVariant[]>>;
  onSelectCreated: (variant: FabricVariant, allVariants: FabricVariant[]) => void;
}

export function useCreateFabricVariant({
  fabrics,
  setFabrics,
  colors,
  setColors,
  designs,
  setDesigns,
  setFabricVariants,
  onSelectCreated,
}: UseCreateFabricVariantArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantModalError, setVariantModalError] = useState("");
  const [newFvFabricId, setNewFvFabricId] = useState("");
  const [newFvWarpColorId, setNewFvWarpColorId] = useState("");
  const [newFvWeftColorId, setNewFvWeftColorId] = useState("");
  const [newFvDesignId, setNewFvDesignId] = useState("");

  const [showNewFabricForm, setShowNewFabricForm] = useState(false);
  const [inlineFabricName, setInlineFabricName] = useState("");
  const [inlineFabricWeight, setInlineFabricWeight] = useState("500");
  const [inlineFabricLength, setInlineFabricLength] = useState("240");
  const [inlineFabricWidth, setInlineFabricWidth] = useState("150");

  const [showNewWarpColorForm, setShowNewWarpColorForm] = useState(false);
  const [inlineWarpColorName, setInlineWarpColorName] = useState("");

  const [showNewWeftColorForm, setShowNewWeftColorForm] = useState(false);
  const [inlineWeftColorName, setInlineWeftColorName] = useState("");

  const [showNewDesignForm, setShowNewDesignForm] = useState(false);
  const [inlineDesignName, setInlineDesignName] = useState("");

  function open(options?: { searchQuery?: string; currentVariant?: FabricVariant | null }) {
    setVariantModalError("");
    setShowNewFabricForm(false);
    setShowNewWarpColorForm(false);
    setShowNewWeftColorForm(false);
    setShowNewDesignForm(false);

    if (options?.searchQuery?.trim()) {
      setInlineFabricName(options.searchQuery.trim());
    }

    const cur = options?.currentVariant;
    if (cur) {
      const fId = cur.fabricId ?? cur.fabric?.fabricId;
      const wId = cur.warpColorId ?? cur.warpColor?.colorId;
      const fColorId = cur.weftColorId ?? cur.weftColor?.colorId;
      const dId = cur.designId ?? cur.design?.designId;
      if (fId) setNewFvFabricId(String(fId));
      if (wId) setNewFvWarpColorId(String(wId));
      if (fColorId) setNewFvWeftColorId(String(fColorId));
      if (dId) setNewFvDesignId(String(dId));
    } else {
      if (fabrics[0] && !newFvFabricId) setNewFvFabricId(String(fabrics[0].fabricId));
      if (colors[0] && !newFvWarpColorId) setNewFvWarpColorId(String(colors[0].colorId));
      if (colors[0] && !newFvWeftColorId) setNewFvWeftColorId(String(colors[0].colorId));
      if (designs[0] && !newFvDesignId) setNewFvDesignId(String(designs[0].designId));
    }

    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  async function handleCreateInlineFabric() {
    if (!inlineFabricName.trim()) return;
    try {
      const created = await catalogApi.createFabric({
        name: inlineFabricName.trim().toLowerCase(),
        standardWeightG: Number(inlineFabricWeight) || 500,
        standardLengthCm: Number(inlineFabricLength) || 240,
        standardWidthCm: Number(inlineFabricWidth) || 150,
      });
      setFabrics((prev) => [...prev, created]);
      setNewFvFabricId(String(created.fabricId));
      setInlineFabricName("");
      setShowNewFabricForm(false);
    } catch (err) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create base fabric");
    }
  }

  async function handleCreateInlineWarpColor() {
    if (!inlineWarpColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({ name: inlineWarpColorName.trim() });
      setColors((prev) => [...prev, created]);
      setNewFvWarpColorId(String(created.colorId));
      setInlineWarpColorName("");
      setShowNewWarpColorForm(false);
    } catch (err) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create color");
    }
  }

  async function handleCreateInlineWeftColor() {
    if (!inlineWeftColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({ name: inlineWeftColorName.trim() });
      setColors((prev) => [...prev, created]);
      setNewFvWeftColorId(String(created.colorId));
      setInlineWeftColorName("");
      setShowNewWeftColorForm(false);
    } catch (err) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create color");
    }
  }

  async function handleCreateInlineDesign() {
    if (!inlineDesignName.trim()) return;
    try {
      const created = await catalogApi.createDesign({ name: inlineDesignName.trim() });
      setDesigns((prev) => [...prev, created]);
      setNewFvDesignId(String(created.designId));
      setInlineDesignName("");
      setShowNewDesignForm(false);
    } catch (err) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create design");
    }
  }

  async function handleSaveNewVariant(e: FormEvent) {
    e.preventDefault();
    setSavingVariant(true);
    setVariantModalError("");
    try {
      if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId) {
        throw new Error("Please select fabric and both warp and weft colors.");
      }
      const effectiveDesignId = Number(newFvDesignId || designs[0]?.designId || 1);
      const created = await catalogApi.createFabricVariant({
        fabricId: Number(newFvFabricId),
        warpColorId: Number(newFvWarpColorId),
        weftColorId: Number(newFvWeftColorId),
        designId: effectiveDesignId,
      });
      const updated = await catalogApi.fabricVariants();
      setFabricVariants(updated);
      const matched = updated.find((v) => v.fabricVariantId === created.fabricVariantId) ?? created;
      onSelectCreated(matched, updated);
      setIsOpen(false);
    } catch (err) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create fabric variant");
    } finally {
      setSavingVariant(false);
    }
  }

  return {
    fabrics,
    colors,
    designs,
    isOpen,
    open,
    close,
    savingVariant,
    variantModalError,
    newFvFabricId,
    setNewFvFabricId,
    newFvWarpColorId,
    setNewFvWarpColorId,
    newFvWeftColorId,
    setNewFvWeftColorId,
    newFvDesignId,
    setNewFvDesignId,
    showNewFabricForm,
    setShowNewFabricForm,
    inlineFabricName,
    setInlineFabricName,
    inlineFabricWeight,
    setInlineFabricWeight,
    inlineFabricLength,
    setInlineFabricLength,
    inlineFabricWidth,
    setInlineFabricWidth,
    handleCreateInlineFabric,
    showNewWarpColorForm,
    setShowNewWarpColorForm,
    inlineWarpColorName,
    setInlineWarpColorName,
    handleCreateInlineWarpColor,
    showNewWeftColorForm,
    setShowNewWeftColorForm,
    inlineWeftColorName,
    setInlineWeftColorName,
    handleCreateInlineWeftColor,
    showNewDesignForm,
    setShowNewDesignForm,
    inlineDesignName,
    setInlineDesignName,
    handleCreateInlineDesign,
    handleSaveNewVariant,
  };
}

export type CreateFabricVariantController = ReturnType<typeof useCreateFabricVariant>;
