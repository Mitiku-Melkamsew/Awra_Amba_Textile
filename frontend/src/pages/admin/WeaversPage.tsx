import { useWeaversManager } from "./weavers/useWeaversManager";
import { WeaverRosterToolbar } from "./weavers/WeaverRosterToolbar";
import { WeaverRosterTable } from "./weavers/WeaverRosterTable";
import { AddWeaverModal } from "./weavers/AddWeaverModal";

export function WeaversPage() {
  const {
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
    error,
    addError,
    setAddError,
    saving,
    handleCreate,
  } = useWeaversManager();

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header mb-4">
        <div>
          <p className="eyebrow">ሸማኔዎች · WEAVERS</p>
          <h1 className="page-title">Weavers</h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowAdd(true);
            setAddError("");
          }}
        >
          + Add weaver
        </button>
      </div>

      {/* ── Weavers Roster ── */}
      <WeaverRosterToolbar
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        count={weavers.length}
      />

      {error && (
        <div className="error-msg mb-4">
          <span>⚠️</span> {error}
        </div>
      )}

      <WeaverRosterTable
        weavers={weavers}
        sort={sort}
        search={search}
      />

      {/* ── Add Weaver Modal ── */}
      <AddWeaverModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreate}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        phone={phone}
        setPhone={setPhone}
        addError={addError}
        saving={saving}
      />
    </div>
  );
}

export default WeaversPage;
