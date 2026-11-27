import { useNavigate } from "react-router-dom";
import { Modal } from "../../../components/common";

interface NewTransactionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTransactionPromptModal({ isOpen, onClose }: NewTransactionPromptModalProps) {
  const navigate = useNavigate();

  const options = [
    {
      title: "Fabric Sale to Merchant",
      titleAm: "የጨርቅ ሽያጭ ለነጋዴ",
      desc: "Sell finished fabrics, shawls, and gabi directly to commercial merchants.",
      route: "/admin/transactions/new/sell/fabric",
      badge: "Commercial Revenue",
      badgeClass: "badge--info",
      icon: "🧵",
    },
    {
      title: "Fabric Purchase from Weaver",
      titleAm: "የጨርቅ ግዢ ከሸማኔ",
      desc: "Purchase completed fabrics or custom pieces directly from a weaver.",
      route: "/admin/transactions/new/buy/fabric",
      badge: "Direct Purchase",
      badgeClass: "badge--warning",
      icon: "✂️",
    },
    {
      title: "Yarn Sale to Weaver",
      titleAm: "የክር ሽያጭ ለሸማኔ",
      desc: "Sell raw yarn spools or warp/weft packages directly to weavers.",
      route: "/admin/transactions/new/sell/yarn",
      badge: "Commercial Revenue",
      badgeClass: "badge--success",
      icon: "🧶",
    },
    {
      title: "Yarn Purchase from Supplier",
      titleAm: "የክር ግዢ ከአቅራቢ",
      desc: "Record procurement of raw yarn cones or packages from wholesale suppliers.",
      route: "/admin/transactions/new/buy/yarn",
      badge: "Procurement Expense",
      badgeClass: "badge--neutral",
      icon: "📦",
    },
  ];

  const handleSelect = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New transaction · አዲስ ግብይት" maxWidth={620}>
      <div className="quick-prompt-body">
        <p className="quick-prompt-description">
          Choose the category and direction of the commercial transaction you want to record:
        </p>

        <div className="txn-tiles-grid">
          {options.map((opt, idx) => (
            <div
              key={idx}
              className="txn-tile"
              onClick={() => handleSelect(opt.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleSelect(opt.route);
              }}
            >
              <div>
                <div className="txn-tile-header">
                  <span className="txn-tile-icon">{opt.icon}</span>
                  <span className={`badge ${opt.badgeClass}`}>{opt.badge}</span>
                </div>
                <h4 className="txn-tile-title">{opt.title}</h4>
                <div className="txn-tile-title-am">{opt.titleAm}</div>
                <p className="txn-tile-desc">{opt.desc}</p>
              </div>

              <div className="txn-tile-action">
                Create transaction →
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
