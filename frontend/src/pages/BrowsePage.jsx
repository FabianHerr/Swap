import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  PiArrowLeftBold,
  PiArrowsLeftRightBold,
  PiCheckCircleBold,
  PiHandCoinsDuotone,
  PiHourglassBold,
  PiMagnifyingGlassBold,
  PiXCircleBold,
} from "react-icons/pi";
import api from "../api";
import { useAuth } from "../AuthContext";
import useCurrencies from "../useCurrencies";
import { Avatar, CurrencySelect, DetailPanelSkeleton, EmptyState, FlagPair, Flash, Hero, ListCard, ListCardSkeleton, SectionTabs } from "../ui";
import { formatAmount, memberFact, offerRate, timeAgo } from "../format";
import { enter, panelSwap, popover, settle } from "../motion";

const MAX_NOTE_LENGTH = 280;
const SKELETON_DELAY_MS = 200;
const POSTED_NOTICE_MS = 6000;

// Once you've asked for an offer, the server won't let you ask again. Each status gets its own
// wording and icon, read as a status line rather than a button, so a finished request never looks
// like it could be pressed.
const OUTGOING_STATUS = {
  pending: { Icon: PiHourglassBold, tone: "pending", text: (name) => `Waiting for ${name} to reply` },
  accepted: { Icon: PiCheckCircleBold, tone: "ok", text: (name) => `${name} accepted, see their email in Requests` },
  declined: { Icon: PiXCircleBold, tone: "quiet", text: (name) => `${name} declined` },
  cancelled: { Icon: PiXCircleBold, tone: "quiet", text: () => "You cancelled this request" },
};

// What the viewer gives and gets for an offer, from their own side of the table
function legsFor(offer, isMine) {
  if (isMine) {
    return {
      primary: { amount: offer.giveAmount, currency: offer.giveCurrency, label: "You have" },
      secondary: { amount: offer.wantAmount, currency: offer.wantCurrency, label: "You want" },
    };
  }
  return {
    primary: { amount: offer.giveAmount, currency: offer.giveCurrency, label: "You get" },
    secondary: { amount: offer.wantAmount, currency: offer.wantCurrency, label: "You give" },
  };
}

function cardTitle(offer, isMine) {
  const { primary, secondary } = legsFor(offer, isMine);
  return `${formatAmount(primary.amount)} ${primary.currency} → ${formatAmount(secondary.amount)} ${secondary.currency}`;
}

function detailSentence(offer, isMine) {
  const { primary, secondary } = legsFor(offer, isMine);
  return isMine
    ? `You have ${formatAmount(primary.amount)} ${primary.currency}, want ${formatAmount(secondary.amount)} ${secondary.currency}`
    : `You get ${formatAmount(primary.amount)} ${primary.currency} for ${formatAmount(secondary.amount)} ${secondary.currency}`;
}

// The inline note composer, inside the detail panel. Closes on Escape or a click outside, and hands
// focus back to the Request swap button when it closes.
function Composer({ offerId, onClose, onRequested }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);
  const triggerId = `request-${offerId}`;

  const close = (returnFocus = true) => {
    onClose();
    if (returnFocus) document.getElementById(triggerId)?.focus();
  };

  useEffect(() => {
    const onPointerDown = (e) => {
      if (formRef.current?.contains(e.target) || document.getElementById(triggerId)?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose, triggerId]);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.post("/requests", { offerId, message: note });
      window.dispatchEvent(new Event("swap:requests-changed"));
      onRequested(offerId);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send the request. Try again.");
      setSending(false);
    }
  };

  return (
    <motion.form
      ref={formRef}
      id={`composer-${offerId}`}
      className="composer"
      onSubmit={send}
      onKeyDown={(e) => e.key === "Escape" && close()}
      {...popover}
    >
      <label htmlFor={`note-${offerId}`} className="label">Add a note (optional)</label>
      <textarea
        id={`note-${offerId}`}
        className="textarea"
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Where and when could you meet?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autoFocus
        style={{ marginTop: 8 }}
      />
      <div className="composer-foot">
        <span className="field-error" role="alert">{error}</span>
        <span>{note.length}/{MAX_NOTE_LENGTH}</span>
      </div>
      <div className="composer-actions">
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => close()}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
          {sending ? "Sending…" : "Send request"}
        </button>
      </div>
    </motion.form>
  );
}

function BrowsePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { currencies } = useCurrencies();

  const [tab, setTab] = useState("market");
  const [have, setHave] = useState(() => location.state?.filters?.have || "");
  const [need, setNeed] = useState(() => location.state?.filters?.need || "");
  const [flips, setFlips] = useState(0);
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  // Offer id -> { status, name }: the real outcome of a request you sent
  const [requestedStatus, setRequestedStatus] = useState(() => ({}));
  const [askedCounts, setAskedCounts] = useState({});
  const [composingId, setComposingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const showSkeleton = !loaded && slow;

  // Set when arriving from "Post offer": the new offer is selected and a notice says it's live
  const [postedOfferId] = useState(location.state?.postedOfferId);
  const [postedNotice, setPostedNotice] = useState(Boolean(postedOfferId));
  // Set when arriving from the assistant panel: an offer to select once the (possibly refiltered) list has loaded
  const [pendingSelectId, setPendingSelectId] = useState(location.state?.selectOfferId ?? null);

  // Applies router state handed in by "Post offer" or the assistant panel, then clears it so a
  // refresh or back-navigation doesn't redo it. Keyed on location.key (not just on mount) so
  // navigating to /offers again with fresh state, while already here, is picked up too.
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.filters) {
      setHave(state.filters.have || "");
      setNeed(state.filters.need || "");
    }
    if (state.selectOfferId) setPendingSelectId(state.selectOfferId);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    if (!postedNotice) return;
    const timer = setTimeout(() => setPostedNotice(false), POSTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [postedNotice]);

  useEffect(() => {
    api.get("/requests/outgoing")
      .then((res) => {
        const byOffer = {};
        for (const r of res.data.requests) {
          if (r.offer?._id) byOffer[r.offer._id] = { status: r.status, name: r.counterpart.name };
        }
        setRequestedStatus(byOffer);
      })
      .catch(() => {});
    api.get("/requests/incoming")
      .then((res) => {
        const counts = {};
        for (const r of res.data.requests) {
          if (r.offer && (r.status === "pending" || r.status === "accepted")) counts[r.offer._id] = (counts[r.offer._id] || 0) + 1;
        }
        setAskedCounts(counts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/offer", { params: { give: need || undefined, want: have || undefined } })
      .then((res) => active && setOffers(res.data.offers))
      .catch((err) => active && setError(err.response?.data?.message || "Couldn't load offers. Try again."))
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setLoaded(true);
        setSlow(false);
      });
    return () => { active = false; };
  }, [have, need]);

  const list = useMemo(() => {
    let base = tab === "mine" ? offers.filter((o) => o.owner === user._id) : offers;
    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((o) =>
        o.ownerName?.toLowerCase().includes(q) || o.giveCurrency?.toLowerCase().includes(q) || o.wantCurrency?.toLowerCase().includes(q)
      );
    }
    return base;
  }, [offers, tab, search, user._id]);

  // Keep the selection valid as the list changes; prefer a pending assistant match, then the
  // just-posted offer, then the first row. A pending match arrives alongside new filters, so the
  // list may still be mid-refetch for those filters when this runs; only consume (clear) the
  // pending id once it's actually found, rather than on the first pass, so a stale intermediate
  // list can't cause it to be dropped before the refiltered list arrives.
  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null);
      return;
    }
    const foundPending = pendingSelectId && list.some((o) => o._id === pendingSelectId);
    setSelectedId((current) => {
      if (foundPending) return pendingSelectId;
      if (current && list.some((o) => o._id === current)) return current;
      if (postedOfferId && list.some((o) => o._id === postedOfferId)) return postedOfferId;
      return list[0]._id;
    });
    if (foundPending) {
      setMobileDetailOpen(true);
      setPendingSelectId(null);
    }
  }, [list, postedOfferId, pendingSelectId]);

  const selected = list.find((o) => o._id === selectedId) || null;

  const flipPair = () => {
    setHave(need);
    setNeed(have);
    setFlips((n) => n + 1);
  };

  const remove = async (id) => {
    setConfirmingId(null);
    try {
      await api.delete(`/offer/${id}`);
      setOffers((current) => current.filter((o) => o._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't remove the offer.");
    }
  };

  const markRequested = (id, name) => {
    setRequestedStatus((current) => ({ ...current, [id]: { status: "pending", name } }));
    setComposingId(null);
  };

  const closeComposer = useCallback(() => setComposingId(null), []);

  const openDetail = (id) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const filtered = Boolean(have || need);
  const currencyOptions = currencies.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>);
  const myOfferCount = offers.filter((o) => o.owner === user._id).length;

  const metaFor = (offer, isMine) => {
    const rate = offerRate(offer);
    const asked = askedCounts[offer._id] || 0;
    let tag = null;
    if (isMine) {
      if (asked > 0) tag = <span className="tag tag-pink">{asked === 1 ? "1 request" : `${asked} requests`}</span>;
      else if (tab === "market") tag = <span className="tag">Yours</span>;
    } else if (requestedStatus[offer._id]) {
      tag = <span className={`tag status-${requestedStatus[offer._id].status}`}>{requestedStatus[offer._id].status}</span>;
    }
    return (
      <>
        {rate && <span>{rate}</span>}
        {tag}
        {offer.createdAt && <span>{timeAgo(offer.createdAt)}</span>}
      </>
    );
  };

  const detailContent = () => {
    if (!selected) return null;
    const isMine = selected.owner === user._id;
    const { primary, secondary } = legsFor(selected, isMine);
    const rate = offerRate(selected);
    const fact = !isMine && memberFact(selected.ownerProfile);
    const composing = composingId === selected._id;
    const confirming = confirmingId === selected._id;
    const requested = !isMine && requestedStatus[selected._id];

    return (
      <motion.div key={selected._id} {...panelSwap} className="panel detail-panel">
        <button type="button" className="detail-back" onClick={() => setMobileDetailOpen(false)}>
          <PiArrowLeftBold aria-hidden="true" /> Back to list
        </button>

        <div className="detail-head">
          <FlagPair give={primary.currency} want={secondary.currency} size={56} />
          <div>
            <h2 className="detail-title">{detailSentence(selected, isMine)}</h2>
            <p className="detail-sub">
              <Avatar name={selected.ownerName} size={20} />
              {isMine ? "Your offer" : selected.ownerName}
            </p>
            {fact && <p className="detail-meta">{fact}</p>}
          </div>
        </div>

        {isMine ? (
          confirming ? (
            <div className="detail-status-line">
              Remove this offer?
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmingId(null)}>Keep</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(selected._id)}>Remove</button>
            </div>
          ) : (
            <div className="detail-actions">
              <Link className="btn btn-secondary" to="/requests">View requests</Link>
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmingId(selected._id)}>Remove</button>
            </div>
          )
        ) : requested ? (
          (() => {
            const { Icon, tone, text } = OUTGOING_STATUS[requested.status];
            return (
              <p className={`detail-status-line tone-${tone}`} role="status">
                <Icon aria-hidden="true" /> {text(requested.name)}
                <Link
                  className="detail-status-view"
                  to="/requests"
                  state={{ tab: "outgoing" }}
                  aria-label="View this request in Requests"
                >
                  View
                </Link>
              </p>
            );
          })()
        ) : (
          <>
            <div className="detail-actions">
              <button
                type="button"
                id={`request-${selected._id}`}
                className="btn btn-primary"
                aria-expanded={composing}
                aria-controls={`composer-${selected._id}`}
                onClick={() => setComposingId(composing ? null : selected._id)}
              >
                Request swap
              </button>
            </div>
            <AnimatePresence>
              {composing && (
                <Composer
                  key="composer"
                  offerId={selected._id}
                  onClose={closeComposer}
                  onRequested={(id) => markRequested(id, selected.ownerName)}
                />
              )}
            </AnimatePresence>
          </>
        )}

        <div className="detail-divider" />
        <p className="eyebrow">About this swap</p>
        <div className="detail-body" style={{ marginTop: 16 }}>
          <dl>
            <dt>{primary.label}</dt>
            <dd>{formatAmount(primary.amount)} {primary.currency}</dd>
            <dt>{secondary.label}</dt>
            <dd>{formatAmount(secondary.amount)} {secondary.currency}</dd>
            <dt>{isMine ? "Your rate" : "Their rate"}</dt>
            <dd>{rate || "—"}</dd>
            <dt>Posted</dt>
            <dd>{selected.createdAt ? timeAgo(selected.createdAt) : "—"}</dd>
          </dl>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <SectionTabs
        id="offers-tabs"
        label="Offers"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "market", label: "Market" },
          { key: "mine", label: "Your offers", count: myOfferCount },
        ]}
      />

      <Hero
        headline="Swap the cash you have left over."
        sub="Cash other people want to swap. Find an offer that fits and send a request; emails stay private until they accept."
        meta={loaded && <><strong>{list.length}</strong> {list.length === 1 ? "offer" : "offers"}</>}
      />

      <div className="filters">
        <div className="field-icon filters-search">
          <PiMagnifyingGlassBold aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Search by name or currency"
            aria-label="Search offers by poster name or currency"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pair-picker" role="group" aria-label="Filter offers by currency">
          <div className="pair-field">
            <CurrencySelect id="filter-have" aria-label="You have" value={have} onChange={(e) => setHave(e.target.value)}>
              <option value="">Any</option>
              {currencyOptions}
            </CurrencySelect>
          </div>
          <button type="button" className="pair-flip" onClick={flipPair} disabled={!filtered} aria-label="Swap the two currencies">
            <motion.span className="pair-flip-icon" animate={{ rotate: flips * 180 }} transition={settle}>
              <PiArrowsLeftRightBold aria-hidden="true" />
            </motion.span>
          </button>
          <div className="pair-field">
            <CurrencySelect id="filter-need" aria-label="You need" value={need} onChange={(e) => setNeed(e.target.value)}>
              <option value="">Any</option>
              {currencyOptions}
            </CurrencySelect>
          </div>
        </div>
      </div>

      <Flash tone="ok" message={postedNotice && "Your offer is live. Requests for it show up under Requests."} />
      <Flash tone="error" message={error} />

      {loaded && !loading && list.length === 0 ? (
        <EmptyState
          key={filtered || search ? "filtered" : "none"}
          icon={filtered || search ? PiMagnifyingGlassBold : PiHandCoinsDuotone}
          eyebrow="For you"
          title={filtered || search ? "No offers match" : "No open offers yet"}
          action={<Link to="/offer" className="btn btn-primary">Post an offer</Link>}
          {...enter()}
        >
          {filtered || search
            ? "Try another currency or search term, or post an offer so the next person looking finds you."
            : "Post the cash you have and what you want for it. People who need it will find it here."}
        </EmptyState>
      ) : (
        <div className={`master-detail ${mobileDetailOpen ? "is-showing-detail" : ""}`} aria-busy={loading}>
          <div className="list-col">
            <AnimatePresence mode="popLayout">
              {showSkeleton && Array.from({ length: 5 }, (_, i) => (
                <ListCardSkeleton key={`skeleton-${i}`} {...enter(i)} exit={{ opacity: 0, transition: { duration: 0.1 } }} />
              ))}
              {loaded && list.map((offer, i) => {
                const isMine = offer.owner === user._id;
                return (
                  <ListCard
                    key={offer._id}
                    layout="position"
                    transition={settle}
                    {...enter(i)}
                    tile={<FlagPair give={legsFor(offer, isMine).primary.currency} want={legsFor(offer, isMine).secondary.currency} />}
                    title={cardTitle(offer, isMine)}
                    sub={isMine ? "Your offer" : offer.ownerName}
                    meta={metaFor(offer, isMine)}
                    selected={offer._id === selectedId}
                    onClick={() => openDetail(offer._id)}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          <div className="detail-col">
            <AnimatePresence mode="wait" initial={false}>
              {loaded ? detailContent() : <DetailPanelSkeleton key="skeleton" />}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

export default BrowsePage;
