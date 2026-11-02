import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { weaversApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverCard } from "../../components/WeaverCard";

export function WeaversPage() {
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "id">(() =>
    localStorage.getItem("weavers.sort") === "id" ? "id" : "name",
  );
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setWeavers(await weaversApi.list({ search: search || undefined, sort }));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  useEffect(() => {
    localStorage.setItem("weavers.sort", sort);
  }, [sort]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setAddError("");
    setSaving(true);
    try {
      await weaversApi.create({
        firstName,
        lastName,
        phone: phone || undefined,
        bankAccountNumber: bankAccount || undefined,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setBankAccount("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create weaver",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">አሸጋዮች / Weavers Roster</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Weaver Management</h1>
            <span className="badge badge-green">{weavers.length} Active</span>
          </div>
          <p className="page-subtitle">
            Manage cooperative artisans, assign work orders (Zigs), and track handwoven production.
          </p>
        </div>
        <button
          type="button"
          className={showAdd ? "btn-ghost" : "btn-primary"}
          onClick={() => {
            setShowAdd(!showAdd);
            setAddError("");
          }}
        >
          {showAdd ? "✕ Cancel" : "+ አዲስ አሸጋይ / Add Weaver"}
        </button>
      </div>

      {/* Add weaver inline form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: "1.5rem", border: "1.5px solid var(--accent)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <span>➕</span> Register New Artisan Weaver
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>All fields except phone/bank are required</span>
          </div>
          <form className="form" onSubmit={handleCreate}>
            <div className="form-row">
              <label>
                <span>First name / ስም</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Abebe"
                  autoFocus
                  required
                />
              </label>
              <label>
                <span>Last name / የአባት ስም</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Alemu"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Phone number / ስልክ (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9xx xxx xxx"
                />
              </label>
              <label>
                <span>Bank account number (optional)</span>
                <input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. CBE 100012345678"
                />
              </label>
            </div>

            {addError && (
              <div className="error-msg">
                <span>⚠️</span> {addError}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Creating…" : "Create Weaver / መዝግብ"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍  Search by weaver name, phone number, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "name" | "id")}
          style={{ height: 42, width: 160 }}
        >
          <option value="name">Sort: Name (A–Z)</option>
          <option value="id">Sort: Weaver ID</option>
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Weaver list */}
      <div className="weaver-list">
        {weavers.length === 0 && !error ? (
          <div className="empty-state">
            <span className="empty-icon">🧑‍🤝‍🧑</span>
            <p style={{ fontWeight: 600, color: "var(--text)" }}>
              {search ? "No artisans match your search criteria." : "No weavers registered yet."}
            </p>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {search ? "Try searching for a different name or phone." : "Click '+ Add Weaver' above to register the first artisan."}
            </span>
          </div>
        ) : (
          weavers.map((weaver) => (
            <WeaverCard
              key={weaver.weaverId}
              weaver={weaver}
              to={`/admin/weavers/${weaver.weaverId}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WeaversPage;
