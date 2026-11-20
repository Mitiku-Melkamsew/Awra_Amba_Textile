import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { weaversApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverRatesTransparency } from "../../components/WeaverRatesTransparency";
import { WeaverWageCalculator } from "../../components/WeaverWageCalculator";

export function WeaversPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: "roster" | "rates" | "calculator" =
    rawTab === "rates" || rawTab === "calculator" ? rawTab : "roster";

  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "id">(() =>
    localStorage.getItem("weavers.sort") === "id" ? "id" : "name",
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
        err instanceof Error ? err.message : "Failed to create weaver",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleTabChange(newTab: "roster" | "rates" | "calculator") {
    setSearchParams(newTab === "roster" ? {} : { tab: newTab });
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem" }}>
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER (Image 2)
         ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            margin: "0 0 0.35rem 0",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ሸማኔዎች · WEAVERS
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Weavers
          </h1>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true);
              setAddError("");
            }}
            style={{
              background: "var(--brand, #c2410c)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.35rem",
              fontSize: "0.92rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              transition: "background 0.15s ease",
            }}
          >
            + Add weaver
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs (Roster, Rates, Calculator) */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange("roster")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "6px",
            border: "none",
            background: tab === "roster" ? "#f1f5f9" : "transparent",
            color: tab === "roster" ? "#0f172a" : "#64748b",
            fontWeight: tab === "roster" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          Artisans Roster
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("rates")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "6px",
            border: "none",
            background: tab === "rates" ? "#f1f5f9" : "transparent",
            color: tab === "rates" ? "#0f172a" : "#64748b",
            fontWeight: tab === "rates" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          Piece Rates & Transparency
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("calculator")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "6px",
            border: "none",
            background: tab === "calculator" ? "#f1f5f9" : "transparent",
            color: tab === "calculator" ? "#0f172a" : "#64748b",
            fontWeight: tab === "calculator" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          Wage & Deduction Calculator
        </button>
      </div>

      {/* Tab 2: Rates & Transparency */}
      {tab === "rates" && <WeaverRatesTransparency />}

      {/* Tab 3: Wage & Deduction Calculator */}
      {tab === "calculator" && <WeaverWageCalculator />}

      {/* Tab 1: Artisans Roster (Image 2) */}
      {tab === "roster" && (
        <>
          {/* ─────────────────────────────────────────────────────────────
              TOOLBAR: Search, Sort Buttons & Count (Image 2)
             ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            {/* Search Box */}
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, phone or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.6rem 0.75rem 0.6rem 2.4rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.92rem",
                  color: "#0f172a",
                  outline: "none",
                }}
              />
            </div>

            {/* Sort A-Z button */}
            <button
              type="button"
              onClick={() => setSort("name")}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                border: sort === "name" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                background: sort === "name" ? "#ffffff" : "#ffffff",
                color: sort === "name" ? "#c2410c" : "#475569",
                fontWeight: sort === "name" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: sort === "name" ? "0 1px 3px rgba(234, 88, 12, 0.12)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sort A–Z
            </button>

            {/* Sort by ID button */}
            <button
              type="button"
              onClick={() => setSort("id")}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                border: sort === "id" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                background: sort === "id" ? "#ffffff" : "#ffffff",
                color: sort === "id" ? "#c2410c" : "#475569",
                fontWeight: sort === "id" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: sort === "id" ? "0 1px 3px rgba(234, 88, 12, 0.12)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sort by ID
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="active">Active Only</option>
              <option value="all">All Statuses</option>
              <option value="deactivated">Deactivated</option>
            </select>

            {/* Total weavers count */}
            <span
              style={{
                fontSize: "0.88rem",
                color: "#64748b",
                fontWeight: 500,
                whiteSpace: "nowrap",
                marginLeft: "auto",
              }}
            >
              {weavers.length} weavers
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                color: "#b91c1c",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              WEAVERS LIST / TABLE CARD (Image 2)
             ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            {/* Table Header Row (Image 2) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 1.8fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1fr)",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                padding: "0.85rem 1.5rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "capitalize",
              }}
            >
              <span>Weaver · ሸማኔ</span>
              <span>Phone</span>
              <span>Bank account</span>
              <span style={{ textAlign: "right" }}></span>
            </div>

            {/* Empty state */}
            {weavers.length === 0 && !error ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧑‍🤝‍🧑</div>
                <div style={{ fontWeight: 600, color: "#475569", fontSize: "1rem" }}>
                  {search ? "No weavers match your search." : "No weavers found."}
                </div>
                <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {search
                    ? "Try searching for a different name, phone, or ID."
                    : "Click '+ Add weaver' above to register the first artisan."}
                </div>
              </div>
            ) : (
              weavers.map((weaver, index) => {
                const displayName =
                  weaver.fullName ||
                  `Weaver #${weaver.userId}`;
                const isDeactivated = weaver.isActive === false || weaver.user?.isActive === false;

                return (
                  <div
                    key={weaver.userId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(200px, 1.8fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1fr)",
                      alignItems: "center",
                      borderBottom: "1px solid #f8fafc",
                      padding: "0.85rem 1.5rem",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fafafa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    {/* Column 1: Avatar + Weaver Name + ID */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#ffedd5",
                          color: "#9a3412",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {sort === "id" ? weaver.userId : index + 1}
                      </div>
                      <div>
                        <Link
                          to={`/admin/weavers/${weaver.userId}`}
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "0.95rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          {displayName}
                          {isDeactivated && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                              }}
                            >
                              Deactivated
                            </span>
                          )}
                        </Link>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                          ID #{weaver.userId}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Phone */}
                    <div style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>
                      {weaver.phone || "—"}
                    </div>

                    {/* Column 3: Bank account */}
                    <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>
                      [account]
                    </div>

                    {/* Column 4: Issue zig + Chevron Arrow */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      {!isDeactivated ? (
                        <Link
                          to={`/admin/weavers/${weaver.userId}/issue-zig`}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            padding: "0.45rem 1rem",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#334155",
                            textDecoration: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Issue zig
                        </Link>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#94a3b8",
                            fontStyle: "italic",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                      <Link
                        to={`/admin/weavers/${weaver.userId}`}
                        style={{
                          color: "#94a3b8",
                          fontSize: "1.1rem",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          padding: "0.2rem",
                        }}
                      >
                        ›
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Add Weaver
         ───────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 480,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                + Register New Weaver
              </h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.3rem",
                    }}
                  >
                    First name / ስም
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Last name / የአባት ስም
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alemu"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Phone number / ስልክ
                </label>
                <input
                  type="tel"
                  placeholder="+251 9xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Bank account / የባንክ ሂሳብ (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CBE 1000..."
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {addError && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    marginBottom: "1rem",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                  }}
                >
                  {addError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "0.55rem 1.35rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--brand, #c2410c)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Creating…" : "Create Weaver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeaversPage;
