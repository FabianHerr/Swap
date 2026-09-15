import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PiPaperPlaneRightBold, PiWarningCircleBold, PiX } from "react-icons/pi";
import api from "./api";
import { FlagPair, ListCard } from "./ui";
import { formatAmount } from "./format";
import { ease } from "./motion";

const MAX_LENGTH = 500;

const EMPTY_EXAMPLES = [
  "I have 400 CAD and want Colombian pesos",
  "Show me offers selling euros",
  "Post 250 EUR for 370 CAD",
];

const SLIDE_TRANSITION = { duration: 0.22, ease: ease.out };
const FADE_TRANSITION = { duration: 0.2, ease: ease.out };

// A tag + one-line message, matching the paste box's parse-status-line on Post offer.
function ResultTagline({ source, message }) {
  return (
    <p className="parse-status-line assistant-tagline">
      <span className={`tag ${source === "llm" ? "tag-pink" : ""}`}>{source === "llm" ? "AI" : "Rules"}</span>
      {message}
    </p>
  );
}

// The non-interactive preview of what the assistant would fill in on Post offer.
function FillFormPreview({ fields = {} }) {
  const hasAmounts = fields.giveAmount && fields.giveCurrency && fields.wantAmount && fields.wantCurrency;
  return (
    <div className="list-card assistant-preview-card" aria-hidden="true">
      <FlagPair give={fields.giveCurrency} want={fields.wantCurrency} />
      <span className="list-card-body">
        <span className="list-card-title">
          {hasAmounts
            ? `${formatAmount(fields.giveAmount)} ${fields.giveCurrency} → ${formatAmount(fields.wantAmount)} ${fields.wantCurrency}`
            : "Enter both amounts"}
        </span>
      </span>
    </div>
  );
}

function WarningList({ warnings = [] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="parse-warnings">
      {warnings.map((w, i) => <li key={i}>{w.message}</li>)}
    </ul>
  );
}

function FillFormResult({ result, onOpenForm }) {
  const { fields, warnings, source, rawInput } = result;
  return (
    <>
      <FillFormPreview fields={fields} />
      <WarningList warnings={warnings} />
      <div className="assistant-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onOpenForm({ fields, warnings, source, rawInput })}
        >
          Open in Post offer
        </button>
      </div>
    </>
  );
}

function SearchResult({ result, onSeeOffers }) {
  const { filters, count } = result;
  const label = count > 0 ? `See ${count} ${count === 1 ? "offer" : "offers"}` : "See offers";
  return (
    <div className="assistant-actions">
      <button type="button" className="btn btn-primary btn-sm" onClick={() => onSeeOffers(filters)}>{label}</button>
    </div>
  );
}

function MatchesResult({ result, onSelectMatch, onSeeAll, onOpenForm }) {
  const { matches = [], total = 0, filters, fields, warnings, source, rawInput } = result;
  const hasMatches = matches.length > 0;
  return (
    <>
      {hasMatches && (
        <div className="assistant-matches">
          {matches.map((m) => (
            <ListCard
              key={m._id}
              tile={<FlagPair give={m.giveCurrency} want={m.wantCurrency} />}
              title={`${formatAmount(m.giveAmount)} ${m.giveCurrency} → ${formatAmount(m.wantAmount)} ${m.wantCurrency}`}
              sub={m.ownerName}
              meta={
                <>
                  <span className="assistant-match-reason">{m.reasons?.[0]}</span>
                  {m.requested && <span className="tag">Requested</span>}
                </>
              }
              onClick={() => onSelectMatch(filters, m._id)}
            />
          ))}
        </div>
      )}
      {total > matches.length && <p className="assistant-note">Showing {matches.length} of {total}</p>}
      <div className="assistant-actions">
        {hasMatches && (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => onSeeAll(filters)}>
            See all on Offers
          </button>
        )}
        <button
          type="button"
          className={`btn btn-sm ${hasMatches ? "btn-secondary" : "btn-primary"}`}
          onClick={() => onOpenForm({ fields, warnings, source, rawInput })}
        >
          Post this as an offer
        </button>
      </div>
    </>
  );
}

function HelpResult({ result, onSend }) {
  const { examples = [] } = result;
  return (
    <div className="assistant-examples">
      {examples.map((ex, i) => (
        <button key={i} type="button" className="assistant-example" onClick={() => onSend(ex)}>{ex}</button>
      ))}
    </div>
  );
}

function ResultBody({ result, handlers }) {
  switch (result.action) {
    case "fill_form":
      return <FillFormResult result={result} onOpenForm={handlers.onOpenForm} />;
    case "search":
      return <SearchResult result={result} onSeeOffers={handlers.onSeeOffers} />;
    case "find_matches":
      return (
        <MatchesResult
          result={result}
          onSelectMatch={handlers.onSelectMatch}
          onSeeAll={handlers.onSeeAll}
          onOpenForm={handlers.onOpenForm}
        />
      );
    case "help":
      return <HelpResult result={result} onSend={handlers.onSend} />;
    default:
      return null;
  }
}

// One exchange's result: a loading placeholder, an error card, or the real result by action.
function Exchange({ item, handlers }) {
  if (item.status === "loading") {
    return (
      <div className="assistant-result assistant-result-loading" aria-live="polite">
        Reading…
      </div>
    );
  }
  if (item.status === "error") {
    return (
      <div className="assistant-result assistant-result-error" role="alert">
        <PiWarningCircleBold aria-hidden="true" /> {item.error}
      </div>
    );
  }
  const { result } = item;
  return (
    <div className="assistant-result">
      <ResultTagline source={result.source} message={result.message} />
      <ResultBody result={result} handlers={handlers} />
    </div>
  );
}

function AssistantPanel({ open, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const threadEndRef = useRef(null);
  const lastFocusRef = useRef(null);
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Move focus into the panel on open, and give it back to whatever opened it on close.
  useEffect(() => {
    if (open) {
      lastFocusRef.current = document.activeElement;
      const timer = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
    lastFocusRef.current?.focus?.();
    lastFocusRef.current = null;
  }, [open]);

  // Escape closes; Tab is trapped inside the panel while it's open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread, open]);

  const send = async (message) => {
    const text = message.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const id = `${Date.now()}-${Math.random()}`;
    setThread((t) => [...t, { id, message: text, status: "loading" }]);
    try {
      const res = await api.post("/assistant", { message: text });
      setThread((t) => t.map((item) => (item.id === id ? { ...item, status: "done", result: res.data } : item)));
    } catch (err) {
      const message422 = err.response?.status === 422 && err.response?.data?.message;
      const errorText = message422 || "Couldn't reach the assistant. Try again.";
      setThread((t) => t.map((item) => (item.id === id ? { ...item, status: "error", error: errorText } : item)));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handlers = {
    onOpenForm: ({ fields, warnings, source, rawInput }) => {
      navigate("/offer", { state: { prefill: { fields, warnings, source, rawInput } } });
      onClose();
    },
    onSeeOffers: (filters) => {
      navigate("/offers", { state: { filters } });
      onClose();
    },
    onSelectMatch: (filters, selectOfferId) => {
      navigate("/offers", { state: { filters, selectOfferId } });
      onClose();
    },
    onSeeAll: (filters) => {
      navigate("/offers", { state: { filters } });
      onClose();
    },
    onSend: (text) => send(text),
  };

  return (
    <>
      <motion.button
        type="button"
        className="assistant-backdrop"
        aria-hidden="true"
        tabIndex={-1}
        inert={!open}
        onClick={onClose}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={FADE_TRANSITION}
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
      <motion.div
        ref={panelRef}
        className="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        aria-hidden={!open}
        inert={!open}
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={SLIDE_TRANSITION}
      >
        <div className="assistant-header">
          <div>
            <p className="eyebrow">Assistant</p>
            <h2 className="assistant-title" id="assistant-title">Ask Swap</h2>
          </div>
          <div className="assistant-header-actions">
            {thread.length > 0 && (
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setThread([])}>Clear</button>
            )}
            <button type="button" className="btn btn-quiet assistant-close" aria-label="Close assistant" onClick={onClose}>
              <PiX aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="assistant-sub">Describe what you have or want. I can fill an offer, search offers, or find matches.</p>

        <div className="assistant-thread">
          {thread.length === 0 ? (
            <div className="assistant-empty">
              {EMPTY_EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="assistant-example" onClick={() => send(ex)}>{ex}</button>
              ))}
            </div>
          ) : (
            thread.map((item) => (
              <div key={item.id} className="assistant-exchange">
                <p className="assistant-msg">{item.message}</p>
                <Exchange item={item} handlers={handlers} />
              </div>
            ))
          )}
          <div ref={threadEndRef} />
        </div>

        <form className="assistant-composer" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="textarea assistant-textarea"
            rows={2}
            maxLength={MAX_LENGTH}
            placeholder="Describe what you have or want"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message to Ask Swap"
          />
          <button type="submit" className="btn btn-quiet assistant-send" aria-label="Send" disabled={sending || !input.trim()}>
            <PiPaperPlaneRightBold aria-hidden="true" />
          </button>
        </form>
      </motion.div>
    </>
  );
}

export default AssistantPanel;
