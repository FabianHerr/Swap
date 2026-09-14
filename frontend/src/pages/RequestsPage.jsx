import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import api from "../api";
import { formatAmount, timeAgo } from "../format";

const STATUS_STYLES = {
  pending: "text-bg-warning",
  accepted: "text-bg-success",
  declined: "text-bg-secondary",
  cancelled: "text-bg-light border",
};

const offerLabel = (offer) => `${formatAmount(offer.amount)} ${offer.giveCurrency} → ${offer.wantCurrency}`;

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status]} text-capitalize`}>{status}</span>;
}

// Shown on both sides once the owner accepts. The API only includes the email at that point.
function Contact({ request }) {
  const { counterpart, offer } = request;
  if (!counterpart.email) return null;
  const subject = encodeURIComponent(`Swap: ${offer ? offerLabel(offer) : "our swap"}`);
  return (
    <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-0 mt-3">
      <FiMail />
      <span>
        Contact {counterpart.name}: <a href={`mailto:${counterpart.email}?subject=${subject}`}>{counterpart.email}</a>
      </span>
    </div>
  );
}

function RequestCard({ request, busy, onChangeStatus }) {
  const { offer, counterpart, role, status } = request;
  const incoming = role === "owner";

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="fw-bold">
              {incoming
                ? <>{counterpart.name} wants your {offer ? offerLabel(offer) : "offer"}</>
                : <>You asked {counterpart.name} for {offer ? offerLabel(offer) : "an offer"}</>}
            </div>
            <div className="small text-muted">
              {timeAgo(request.createdAt)}
              {!offer && " · offer was deleted"}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {request.message && (
          <blockquote className="border-start border-3 ps-3 my-3 text-body-secondary">{request.message}</blockquote>
        )}

        {status === "pending" && (
          <div className="d-flex gap-2 mt-3">
            {incoming ? (
              <>
                <button className="btn btn-success btn-sm" disabled={busy} onClick={() => onChangeStatus(request, "accepted")}>
                  Accept
                </button>
                <button className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => onChangeStatus(request, "declined")}>
                  Decline
                </button>
              </>
            ) : (
              <button className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={() => onChangeStatus(request, "cancelled")}>
                Cancel request
              </button>
            )}
          </div>
        )}

        <Contact request={request} />
      </div>
    </div>
  );
}

function RequestsPage() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === "outgoing" ? "outgoing" : "incoming");
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => Promise.all([api.get("/requests/incoming"), api.get("/requests/outgoing")])
    .then(([incoming, outgoing]) => setRequests({ incoming: incoming.data.requests, outgoing: outgoing.data.requests }));

  useEffect(() => {
    load()
      .catch(() => setError("Couldn't load your requests. Try again."))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (request, status) => {
    setBusyId(request._id);
    setError("");
    try {
      await api.patch(`/requests/${request._id}`, { status });
      // Accepting also declines other pending requests on the same offer, so reload rather than patch one card
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update the request.");
      await load().catch(() => {});
    } finally {
      setBusyId(null);
    }
  };

  const pendingIncoming = requests.incoming.filter((r) => r.status === "pending").length;
  const list = requests[tab];

  return (
    <div className="container py-4" style={{ maxWidth: "720px" }}>
      <h2 className="mb-1">Swap requests</h2>
      <p className="text-muted">Accept a request to share contact details with that person.</p>

      <ul className="nav nav-tabs mb-3">
        {[["incoming", "Incoming"], ["outgoing", "Sent"]].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {label}
              {key === "incoming" && pendingIncoming > 0 && (
                <span className="badge rounded-pill text-bg-primary ms-2">{pendingIncoming}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading requests…</p>
      ) : list.length === 0 ? (
        <div className="text-center text-muted border rounded-3 py-5">
          {tab === "incoming" ? (
            <p className="mb-0">No requests on your offers yet.</p>
          ) : (
            <>
              <p className="mb-2">You haven't requested any offers yet.</p>
              <Link to="/offers" className="btn btn-primary btn-sm">Browse offers</Link>
            </>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {list.map((request) => (
            <RequestCard key={request._id} request={request} busy={busyId === request._id} onChangeStatus={changeStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
