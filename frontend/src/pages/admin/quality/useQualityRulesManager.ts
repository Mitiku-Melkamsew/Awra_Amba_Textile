import { useEffect, useState, useMemo, type FormEvent } from "react";
import { catalogApi, type QualityRuleRow } from "../../../api";

export function useQualityRulesManager() {
  const [rules, setRules] = useState<QualityRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  // Edit panel state
  const [editDeduction, setEditDeduction] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal for + Add rule
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFactor, setNewFactor] = useState("weight");
  const [newUnit, setNewUnit] = useState("g");
  const [newDeduction, setNewDeduction] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function loadRules() {
    setLoading(true);
    try {
      const data = await catalogApi.qualityRules();
      if (Array.isArray(data) && data.length > 0) {
        setRules(data);
        const active = data.find((r) => r.isActive !== false) || data[0];
        setSelectedRuleId(active.qualityRuleId);
        setEditDeduction(String(active.deductionPerUnit));
      } else {
        setRules([]);
        setSelectedRuleId(null);
        setEditDeduction("");
      }
    } catch {
      setRules([]);
      setSelectedRuleId(null);
      setEditDeduction("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const selectedRule = useMemo(() => {
    if (selectedRuleId === null) return null;
    return rules.find((r) => r.qualityRuleId === selectedRuleId) ?? null;
  }, [rules, selectedRuleId]);

  function handleSelectRule(rule: QualityRuleRow) {
    setSelectedRuleId(rule.qualityRuleId);
    setEditDeduction(String(rule.deductionPerUnit));
    setStatusMessage("");
    setErrorMessage("");
  }

  async function handleSaveChanges(e: FormEvent) {
    e.preventDefault();
    if (!selectedRule) return;
    const rateNum = parseFloat(editDeduction);
    if (isNaN(rateNum) || rateNum < 0) {
      setErrorMessage("Please enter a valid deduction rate.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateQualityRule(selectedRule.qualityRuleId, {
        unit: selectedRule.unit,
        deductionPerUnit: rateNum,
      });

      setStatusMessage("Quality rule changes saved successfully.");
      setRules((prev) =>
        prev.map((r) =>
          r.qualityRuleId === selectedRule.qualityRuleId
            ? { ...r, deductionPerUnit: rateNum }
            : r
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update quality rule");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddRule(e: FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(newDeduction);
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMessage("Please enter a valid positive deduction rate.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const created = await catalogApi.createQualityRule({
        factor: newFactor,
        unit: newUnit,
        deductionPerUnit: rateNum,
      });

      setShowAddModal(false);
      setNewDeduction("");
      setStatusMessage("New quality rule added.");
      await loadRules();
      if (created && (created as any).qualityRuleId) {
        setSelectedRuleId((created as any).qualityRuleId);
        setEditDeduction(String(rateNum));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create quality rule");
    } finally {
      setIsCreating(false);
    }
  }

  const displayedRules = useMemo(() => {
    if (showClosed) return rules;
    return rules.filter((r) => r.isActive !== false);
  }, [rules, showClosed]);

  return {
    rules,
    displayedRules,
    loading,
    selectedRuleId,
    setSelectedRuleId,
    selectedRule,
    showClosed,
    setShowClosed,
    editDeduction,
    setEditDeduction,
    isSaving,
    statusMessage,
    errorMessage,
    showAddModal,
    setShowAddModal,
    newFactor,
    setNewFactor,
    newUnit,
    setNewUnit,
    newDeduction,
    setNewDeduction,
    isCreating,
    handleSelectRule,
    handleSaveChanges,
    handleAddRule,
  };
}
