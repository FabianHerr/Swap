import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { PiArrowLeftBold, PiPaperPlaneTiltDuotone, PiTrayDuotone } from "react-icons/pi";
import api from "../api";
import { formatAmount, timeAgo } from "../format";
import { Avatar, ContactSlot, DetailPanelSkeleton, EmptyState, Flash, Hero, ListCard, ListCardSkeleton, SectionTabs, StatusBadge } from "../ui";
import { enter, panelSwap, settle } from "../motion";

const POLL_MS = 15000;

// A short sentence describing a request from this viewer's side
function requestTitle(request) {
  const { offer, counterpart, role } = request;
  const incoming = role === "owner";
  if (!offer) {
    return incoming ? `${counterpart.name} asked for an offer you removed` : `You asked ${counterpart.name} for an offer they removed`;
  }
  return incoming
    ? `${counterpart.name} wants your ${formatAmount(offer.giveAmount)} ${offer.giveCurrency} for ${formatAmount(offer.wantAmount)} ${offer.wantCurrency}`
    : `You asked ${counterpart.name} for ${formatAmount(offer.giveAmount)} ${offer.giveCurrency}, in exchange for ${formatAmount(offer.wantAmount)} ${offer.wantCurrency}`;
}

function RequestsPage() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === "outgoing" ? "outgoing" : "incoming");
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [justChangedId, setJustChangedId] = useState(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const [incoming, outgoing] = await Promise.all([api.get("/requests/incoming"), api.get("/requests/outgoing")]);
    setRequests({ incoming: incoming.data.requests, outgoing: outgoing.data.requests });
  }, []);

  useEffect(() => {
    load()
      .catch(() => setError("Couldn't load your requests. Try again."))
      .finally(() => {
        loadedOnce.current = true;
        setLoading(false);
      });

    const refresh = () => { if (!document.hidden) load().catch(() => {}); };
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const changeStatus = async (request, status) => {
    setBusyId(request._id);
    setError("");
    try {
      await api.patch(`/requests/${request._id}`, { status });
      setJustChangedId(request._id);
      setTimeout(() => setJustChangedId(null), 600);
      // Accepting also declines other pending requests on the same offer, so reload rather than patch one row
      await load();
      window.dispatchEvent(new Event("swap:requests-changed"));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update the request.");
      await load().catch(() => {});
    } finally {
      setBusyId(null);
    }
  };

  const list = requests[tab === "outgoing" ? "outgoing" : "incoming"];
  const pendingIncoming = requests.incoming.filter((r) => r.status === "pending").length;

  useEffect(() => {
    if (list.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => (current && list.some((r) => r._id === current) ? current : list[0]._id));
  }, [list]);

  const selected = list.find((r) => r._id === selectedId) || null;

  const stats = useMemo(() => {
    const counts = { pending: 0, accepted: 0, declined: 0, cancelled: 0 };
    for (const r of list) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts;
  }, [list]);

  const openDetail = (id) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const emptyProps = tab === "incoming"
    ? {
        icon: PiTrayDuotone,
        eyebrow: "For you",
        title: "No requests yet",
        action: <Link to="/offer" className="btn btn-primary">Post an offer</Link>,
        children: "When someone requests a swap on one of your offers, their request and note show up here.",
      }
    : {
        icon: PiPaperPlaneTiltDuotone,
        eyebrow: "For you",
        title: "You haven't asked anyone yet",
        action: <Link to="/offers" className="btn btn-primary">Browse offers</Link>,
        children: "Find an offer with the cash you need and send a request.",
      };

  return (
    <>
      <SectionTabs
        id="requests-tabs"
        label="Requests"
        value={tab}
        onChange={setTab}
        controls="requests-panel"
        tabs={[
          { key: "incoming", label: "Received", count: pendingIncoming },
          { key: "outgoing", label: "Sent" },
        ]}
      />

      <Hero
        headline="Your swaps, in one place."
        sub="Accepting a request shares your email with that person, and theirs with you."
      />

      <div className="stats">
        <div className="stat-tile">
          <p className="stat-value">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>
        <div className="stat-tile">
          <p className="stat-value is-pink">{stats.accepted}</p>
          <p className="stat-label">Accepted</p>
        </div>
        <div className="stat-tile">
          <p className="stat-value">{stats.declined}</p>
          <p className="stat-label">Declined</p>
        </div>
        <div className="stat-tile">
          <p className="stat-value">{stats.cancelled}</p>
          <p className="stat-label">Cancelled</p>
        </div>
      </div>

      <Flash tone="error" message={error} />

      {!loading && list.length === 0 ? (
        <EmptyState key={tab} {...enter()} {...emptyProps} />
      ) : (
        <div
          className={`master-detail ${mobileDetailOpen ? "is-showing-detail" : ""}`}
          id="requests-panel"
          role="tabpanel"
          aria-labelledby={`requests-tabs-${tab}`}
          aria-busy={loading}
        >
          <div className="list-col">
            <AnimatePresence mode="popLayout">
              {loading && [0, 1, 2].map((i) => (
                <ListCardSkeleton key={i} {...enter(i)} exit={{ opacity: 0, transition: { duration: 0.1 } }} />
              ))}
              {!loading && list.map((request, i) => (
                <ListCard
                  key={request._id}
                  layout="position"
                  transition={settle}
                  {...enter(i)}
                  tile={<Avatar name={request.counterpart.name} size={40} />}
                  title={requestTitle(request)}
                  sub={request.counterpart.name}
                  meta={
                    <>
                      <StatusBadge status={request.status} isNew={justChangedId === request._id} />
                      <span>{timeAgo(request.createdAt)}</span>
                    </>
                  }
                  selected={request._id === selectedId}
                  onClick={() => openDetail(request._id)}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="detail-col">
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <DetailPanelSkeleton key="skeleton" />
              ) : selected ? (
                <motion.div key={selected._id} {...panelSwap} className="panel detail-panel">
                  <button type="button" className="detail-back" onClick={() => setMobileDetailOpen(false)}>
                    <PiArrowLeftBold aria-hidden="true" /> Back to list
                  </button>

                  <div className="detail-head">
                    <Avatar name={selected.counterpart.name} size={56} />
                    <div>
                      <h2 className="detail-title">{requestTitle(selected)}</h2>
                      <p className="detail-sub">
                        <StatusBadge status={selected.status} isNew={justChangedId === selected._id} />
                        {timeAgo(selected.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selected.status === "pending" && (
                    <div className="detail-actions">
                      {selected.role === "owner" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={busyId === selected._id}
                            onClick={() => changeStatus(selected, "accepted")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busyId === selected._id}
                            onClick={() => changeStatus(selected, "declined")}
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={busyId === selected._id}
                          onClick={() => changeStatus(selected, "cancelled")}
                        >
                          Cancel request
                        </button>
                      )}
                    </div>
                  )}

                  <div className="detail-divider" />

                  <div className="detail-note">
                    <p className="eyebrow">Note</p>
                    {selected.message ? (
                      <blockquote>{selected.message}</blockquote>
                    ) : (
                      <p className="placeholder" style={{ marginTop: 8 }}>No note was included with this request.</p>
                    )}
                  </div>

                  <div className="detail-note">
                    <p className="eyebrow">Contact</p>
                    <div style={{ marginTop: 8 }}>
                      <ContactSlot request={selected} isNew={justChangedId === selected._id} />
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

export default RequestsPage;
