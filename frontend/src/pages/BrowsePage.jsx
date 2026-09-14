import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import api from "../api";
import { useAuth } from "../AuthContext";
import useCurrencies from "../useCurrencies";
import { formatAmount, timeAgo } from "../format";

const MAX_NOTE_LENGTH = 280;

// "Request swap" on someone else's offer: opens an optional note, then sends the request
function RequestSwap({ offerId, requested, onRequested }) {
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (requested) {
    return (
      <div className="mt-auto d-flex align-items-center gap-2 small">
        <span className="text-success fw-bold"><FiCheck /> Requested</span>
        <Link to="/requests" state={{ tab: "outgoing" }}>View</Link>
      </div>
    );
  }

  if (!composing) {
    return (
      <button className="btn btn-primary btn-sm mt-auto align-self-start" onClick={() => setComposing(true)}>
        Request swap
      </button>
    );
  }

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.post("/requests", { offerId, message: note });
      onRequested();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send the request. Try again.");
      setSending(false);
    }
  };

  return (
    <form className="mt-auto" onSubmit={send}>
      <label htmlFor={`note-${offerId}`} className="form-label small fw-bold mb-1">Note (optional)</label>
      <textarea
        id={`note-${offerId}`}
        className="form-control form-control-sm mb-1"
        rows={2}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Where and when could you meet?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoFocus
      />
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="small text-danger">{error}</span>
        <span className="small text-muted">{note.length}/{MAX_NOTE_LENGTH}</span>
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
          {sending ? "Sending…" : "Send request"}
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setComposing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function BrowsePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { currencies } = useCurrencies();
  const [give, setGive] = useState("");
  const [want, setWant] = useState("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [requestedOfferIds, setRequestedOfferIds] = useState(() => new Set());
  // Set when arriving from "Post offer", so the new card can be highlighted once
  const [postedOfferId] = useState(location.state?.postedOfferId);

  // Drop the router state so a refresh doesn't highlight the offer again
  useEffect(() => {
    if (location.state?.postedOfferId) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  // Offers you already asked for show "Requested" instead of the button
  useEffect(() => {
    api.get("/requests/outgoing")
      .then((res) => setRequestedOfferIds(new Set(res.data.requests.map((r) => r.offer?._id).filter(Boolean))))
      .catch(() => {}); // not critical: the server still rejects a duplicate request with a clear message
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/offer", { params: { give: give || undefined, want: want || undefined } })
      .then((res) => active && setOffers(res.data.offers))
      .catch((err) => active && setError(err.response?.data?.message || "Couldn't load offers. Try again."))
      .finally(() => active && setLoading(false));
    // Ignore a slow response for filters the user has already changed
    return () => { active = false; };
  }, [give, want]);

  const deleteOffer = async (id) => {
    try {
      await api.delete(`/offer/${id}`);
      setOffers((current) => current.filter((o) => o._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't delete the offer.");
    } finally {
      setConfirmingId(null);
    }
  };

  const filterSelect = (label, value, onChange) => (
    <select className="form-select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: any</option>
      {currencies.map((c) => <option key={c.code} value={c.code}>{label}: {c.code}</option>)}
    </select>
  );

  return (
    <div className="container py-4" style={{ maxWidth: "960px" }}>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <h2 className="mb-1">Open offers</h2>
          <p className="text-muted mb-0">Cash other people want to swap.</p>
        </div>
        <div className="d-flex gap-2">
          {filterSelect("Gives", give, setGive)}
          {filterSelect("Wants", want, setWant)}
        </div>
      </div>

      {postedOfferId && <div className="alert alert-success">Your offer is live.</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading offers…</p>
      ) : offers.length === 0 ? (
        <div className="text-center text-muted border rounded-3 py-5">
          <p className="mb-2">{give || want ? "No open offers match these currencies." : "No open offers yet."}</p>
          <Link to="/offer" className="btn btn-primary btn-sm">Post an offer</Link>
        </div>
      ) : (
        <div className="row g-3">
          {offers.map((offer) => {
            const isMine = offer.owner === user._id;
            return (
              <div className="col-md-6 col-lg-4" key={offer._id}>
                <div className={`card h-100 shadow-sm ${offer._id === postedOfferId ? "border-success" : ""}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="small text-muted mb-1">Gives</div>
                    <div className="d-flex align-items-center gap-2 fs-4 fw-bold mb-3">
                      <span>{formatAmount(offer.amount)} {offer.giveCurrency}</span>
                      <FiArrowRight className="text-muted" aria-label="for" />
                      <span className="text-primary">{offer.wantCurrency}</span>
                    </div>
                    <div className="small text-muted mb-3">
                      {isMine ? <span className="badge text-bg-light border me-1">Your offer</span> : offer.ownerName}
                      {" · "}{timeAgo(offer.createdAt)}
                    </div>

                    {!isMine && (
                      <RequestSwap
                        offerId={offer._id}
                        requested={requestedOfferIds.has(offer._id)}
                        onRequested={() => setRequestedOfferIds((ids) => new Set(ids).add(offer._id))}
                      />
                    )}

                    {isMine && (
                      <div className="mt-auto d-flex gap-2">
                        {confirmingId === offer._id ? (
                          <>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteOffer(offer._id)}>Delete offer</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setConfirmingId(null)}>Keep</button>
                          </>
                        ) : (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirmingId(offer._id)}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowsePage;
