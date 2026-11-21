import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { weaversApi, type Weaver } from "../../../api";

export function useWeaversManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: "roster" | "rates" | "calculator" =
    rawTab === "rates" || rawTab === "calculator" ? rawTab : "roster";

  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "id">(() =>
    localStorage.getItem("weavers.sort") === "id" ? "id" : "name"
  );
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "deactivated">("active");

  // Add Weaver Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const activeParam =
      statusFilter === "active" ? true : statusFilter === "deactivated" ? false : undefined;
    const filteredList = await weaversApi.list({
      search: search || undefined,
      sort,
      active: activeParam,
    });
    setWeavers(filteredList);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((err) => setError(err.message));
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, statusFilter]);

  useEffect(() => {
    localStorage.setItem("weavers.sort", sort);
  }, [sort]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setAddError("");
    setSaving(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const combinedFullName = `${trimmedFirst} ${trimmedLast}`.trim();
      if (!combinedFullName) {
        setAddError("First and last name are required");
        return;
      }
      await weaversApi.create({
        fullName: combinedFullName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: phone.trim() || undefined,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setBankAccount("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create weaver"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleTabChange(newTab: "roster" | "rates" | "calculator") {
    setSearchParams(newTab === "roster" ? {} : { tab: newTab });
  }

  return {
    tab,
    handleTabChange,
    weavers,
    search,
    setSearch,
    sort,
    setSort,
    statusFilter,
    setStatusFilter,
    showAdd,
    setShowAdd,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    bankAccount,
    setBankAccount,
    error,
    addError,
    setAddError,
    saving,
    handleCreate,
  };
}
