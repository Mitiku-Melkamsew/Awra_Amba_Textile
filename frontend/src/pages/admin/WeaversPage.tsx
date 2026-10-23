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
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");

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
    try {
      await weaversApi.create({ firstName, lastName });
      setFirstName("");
      setLastName("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create weaver",
      );
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">ዛሬ / Weavers</p>
          <h1 className="page-title">አሸጋዮች / Weavers</h1>
          <p className="page-subtitle">
            Tap a weaver to see their work orders.
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
          {showAdd ? "Cancel" : "+ አዲስ አሸጋይ"}
        </button>
      </div>

      {/* Add weaver inline form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="section-title">New Weaver</p>
          <form className="form" onSubmit={handleCreate}>
            <div className="form-row">
              <label>
                First name
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Abebe"
                  autoFocus
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Alemu"
                  required
                />
              </label>
            </div>
            {addError && (
              <div className="error-msg">
                <span>⚠️</span> {addError}
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create Weaver
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
          placeholder="🔍  Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "name" | "id")}
          style={{ height: 38 }}
        >
          <option value="name">Sort A–Z</option>
          <option value="id">Sort by ID</option>
        </select>
      </div>

      {/* Weaver list */}
      {error && (
        <div className="error-msg" style={{ marginBottom: "0.75rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="weaver-list">
        {weavers.length === 0 && !error ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            {search
              ? "No weavers match your search."
              : "No weavers yet. Add the first one."}
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
