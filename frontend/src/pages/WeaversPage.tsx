import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { weaversApi } from "../api";
import type { Weaver } from "../api";

export function WeaversPage() {
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setWeavers(await weaversApi.list());
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await weaversApi.create({ firstName, lastName });
      setFirstName("");
      setLastName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create weaver");
    }
  }

  return (
    <section>
      <h2>Weavers</h2>
      <div className="grid">
        <form className="card form" onSubmit={handleCreate}>
          <h3>Add Weaver</h3>
          <label>
            First name
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label>
            Last name
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
          <button type="submit">Create</button>
        </form>

        <div className="card table-card">
          <h3>Active Weavers ({weavers.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {weavers.map((weaver) => (
                <tr key={weaver.weaverId}>
                  <td>{weaver.weaverId}</td>
                  <td>
                    {weaver.firstName} {weaver.lastName}
                  </td>
                  <td>{weaver.phone ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}