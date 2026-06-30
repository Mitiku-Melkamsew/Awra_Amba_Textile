import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { weaversApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverCard } from "../../components/WeaverCard";

export function WeaversPage() {
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "id">("name");
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setWeavers(await weaversApi.list({ search: search || undefined, sort }));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, sort]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await weaversApi.create({ firstName, lastName });
      setFirstName("");
      setLastName("");
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create weaver");
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ዛሬ / Today</p>
          <h2>አሸጋዮች / Weavers</h2>
          <p className="muted">Tap a weaver to see their work orders.</p>
        </div>
        <button type="button" className="btn-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "+ አዲስ አሸጋይ"}
        </button>
      </header>

      {showAdd && (
        <form className="card form" onSubmit={handleCreate} style={{ marginBottom: "1rem" }}>
          <div className="form-row">
            <label>
              First name
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Last name
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
          </div>
          <button type="submit">Create Weaver</button>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as "name" | "id")}>
          <option value="name">Sort A–Z</option>
          <option value="id">Sort by ID</option>
        </select>
      </div>

      <div className="weaver-grid">
        {weavers.map((weaver) => (
          <WeaverCard
            key={weaver.weaverId}
            weaver={weaver}
            to={`/admin/weavers/${weaver.weaverId}`}
          />
        ))}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}