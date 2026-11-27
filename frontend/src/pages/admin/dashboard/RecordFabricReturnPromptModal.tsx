import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workOrderService } from "../../../infrastructure/services";
import { Modal } from "../../../components/common";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { toTitleCase } from "../../../utils/formatters";

interface RecordFabricReturnPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordFabricReturnPromptModal({
  isOpen,
  onClose,
}: RecordFabricReturnPromptModalProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    workOrderService
      .listWorkOrders()
      .then((data) => {
        if (Array.isArray(data)) {
          const ongoing = data.filter(
            (o) => o.status === "assigned" || o.status === "in_progress" || o.status === "returned",
          );
          setOrders(ongoing);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const zigIdStr = String(o.workOrderId || o.zigId || "");
      const weaverName = (o.weaver?.fullName || o.weaverName || "").toLowerCase();
      const fabricName = (
        o.fabricVariant?.fabric?.name ||
        o.fabricName ||
        o.fabric?.name ||
        ""
      ).toLowerCase();
      return (
        zigIdStr.includes(q) ||
        weaverName.includes(q) ||
        fabricName.includes(q)
      );
    });
  }, [orders, search]);

  const handleSelectZig = (orderId: number) => {
    onClose();
    navigate(`/admin/zigs/${orderId}?action=return`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record fabric return · የጨርቅ ገቢ" maxWidth={640}>
      <div className="quick-prompt-body">
        <p className="quick-prompt-description">
          Select the active work order (zig) to record pieces returned, inspect weights, and calculate deductions:
        </p>

        <input
          type="text"
          className="input"
          placeholder="Search by Weaver name, Zig #, or Fabric…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="quick-prompt-list">
          {loading ? (
            <div className="quick-prompt-empty">
              ⏳ Loading active zigs in WIP…
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="quick-prompt-empty">
              {search ? "No ongoing zigs matched your search." : "No active WIP zigs available for return."}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const orderId = order.workOrderId || order.zigId;
              const weaver = toTitleCase(order.weaver?.fullName || order.weaverName || "Weaver");
              const fabric = toTitleCase(
                order.fabricVariant?.fabric?.name ||
                order.fabricName ||
                order.fabric?.name ||
                "Fabric"
              );
              const issuedDate = formatDateDDMMYY(order.dateIssued || new Date());
              const isReturned = order.status === "returned";

              return (
                <div
                  key={orderId}
                  className="quick-prompt-item"
                  onClick={() => handleSelectZig(orderId)}
                >
                  <div className="quick-prompt-item-left">
                    <span className="quick-prompt-item-tag">#{orderId}</span>
                    <div>
                      <div className="quick-prompt-item-primary">{weaver}</div>
                      <div className="quick-prompt-item-secondary">
                        {fabric} · Issued {issuedDate}
                      </div>
                    </div>
                  </div>

                  <div className="quick-prompt-item-left">
                    <span className={`badge ${isReturned ? "badge--success" : "badge--info"}`}>
                      {isReturned ? "Returned (more)" : "In Progress"}
                    </span>
                    <span className="quick-prompt-item-action">Record return →</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
