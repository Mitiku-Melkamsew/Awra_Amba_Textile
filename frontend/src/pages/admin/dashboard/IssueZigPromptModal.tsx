import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { weaversApi, type Weaver } from "../../../api";
import { Modal } from "../../../components/common";
import { toTitleCase } from "../../../utils/formatters";

interface IssueZigPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IssueZigPromptModal({ isOpen, onClose }: IssueZigPromptModalProps) {
  const navigate = useNavigate();
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Inline create weaver state
  const [showCreate, setShowCreate] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    weaversApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setWeavers(data.filter((w) => w.isActive !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filteredWeavers = useMemo(() => {
    if (!search.trim()) return weavers;
    const q = search.toLowerCase();
    return weavers.filter(
      (w) =>
        (w.fullName || "").toLowerCase().includes(q) ||
        (w.phone || "").toLowerCase().includes(q) ||
        (w.user?.username || "").toLowerCase().includes(q),
    );
  }, [weavers, search]);

  const handleSelectWeaver = (weaverId: number) => {
    onClose();
    navigate(`/admin/weavers/${weaverId}/issue-zig`);
  };

  const handleCreateWeaver = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setCreateError("Weaver full name is required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await weaversApi.create({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      onClose();
      navigate(`/admin/weavers/${res.userId}/issue-zig`);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create weaver");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue new zig · ምረጥ" maxWidth={540}>
      <div className="quick-prompt-body">
        <p className="quick-prompt-description">
          Select an active weaver to issue new weaving work and yarn, or create a new weaver.
        </p>

        {/* Toggle Create / Search */}
        <div className="quick-prompt-toolbar">
          <span className="quick-prompt-subtitle">
            {showCreate ? "New Weaver Details" : "Search Weaver"}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowCreate(!showCreate);
              setCreateError("");
            }}
          >
            {showCreate ? "← Back to search" : "+ Create new weaver"}
          </button>
        </div>

        {showCreate ? (
          <form onSubmit={handleCreateWeaver} className="quick-prompt-form">
            {createError && (
              <div className="alert alert-error">
                ⚠️ {createError}
              </div>
            )}
            <div className="form-field">
              <label className="form-label">
                Full Name (ሙሉ ስም) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Almaz Bekele"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Phone Number (ስልክ ቁጥር)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 0911234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="quick-prompt-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Creating…" : "Create & Issue Zig →"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <input
              type="text"
              className="input"
              placeholder="Type weaver name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="quick-prompt-list">
              {loading ? (
                <div className="quick-prompt-empty">
                  Loading active weavers…
                </div>
              ) : filteredWeavers.length === 0 ? (
                <div className="quick-prompt-empty">
                  {search ? "No weavers matched your search." : "No active weavers found."}
                </div>
              ) : (
                filteredWeavers.map((w) => (
                  <div
                    key={w.userId}
                    className="quick-prompt-item"
                    onClick={() => handleSelectWeaver(w.userId)}
                  >
                    <div>
                      <div className="quick-prompt-item-primary">{toTitleCase(w.fullName)}</div>
                      <div className="quick-prompt-item-secondary">
                        {w.phone ? `📞 ${w.phone}` : w.user?.username ? `@${w.user.username}` : `ID #${w.userId}`}
                      </div>
                    </div>
                    <span className="quick-prompt-item-action">Issue zig →</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
