import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { PiArrowsDownUpBold, PiLockSimpleBold, PiWarningCircleBold } from "react-icons/pi";
import api from "../api";
import { useAuth } from "../AuthContext";
import useCurrencies from "../useCurrencies";
import { Avatar, CurrencySelect, FlagPair, Flash, Hero } from "../ui";
import { formatAmount, offerRate } from "../format";
import { ease, enter, settle } from "../motion";

const PASTE_MAX_LENGTH = 500;
const GENERIC_PARSE_ERROR = "Couldn't read that. Fill the form instead.";

// Order the parser checks fields in: give amount, give currency, want amount, want currency.
// Used both to find the first missing field and to know which DOM id to focus.
const FIELD_ORDER = ["giveAmount", "giveCurrency", "wantAmount", "wantCurrency"];
const FIELD_DOM_ID = {
  giveAmount: "giveAmount",
  giveCurrency: "giveCurrencySelect",
  wantAmount: "wantAmount",
  wantCurrency: "wantCurrencySelect",
};

// A fieldErrors entry is either a plain string (a real server validation error) or
// { message, tone: "notice" } (a gentle parser warning). Both render in the same slot.
function fieldMessage(entry) {
  if (!entry) return null;
  return typeof entry === "string" ? entry : entry.message;
}
function fieldTone(entry) {
  if (!entry) return "error";
  return typeof entry === "string" ? "error" : entry.tone || "error";
}

// A quick, opacity-only crossfade for the parse status line: quieter than the shared `swap`
// preset (which carries a y-shift), matching the same ease curve as the rest of the system.
const statusFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: ease.out } },
};

// One side of the converter: a large amount field with its currency beside it, and the server's complaint below
function ConverterLeg({ id, label, currencyLabel, currencyId, amount, currency, error, onAmount, onCurrency, children }) {
  const message = fieldMessage(error);
  const tone = fieldTone(error);
  return (
    <div className="converter-field">
      <div className="converter-leg">
        <label htmlFor={id} className="converter-label">{label}</label>
        <div className="converter-row">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            className="converter-amount"
            placeholder="0"
            aria-invalid={tone === "error" && Boolean(message)}
            aria-describedby={`${id}-error`}
            value={amount}
            onChange={onAmount}
          />
          <CurrencySelect
            id={currencyId}
            className="converter-currency"
            aria-label={currencyLabel}
            aria-invalid={tone === "error" && Boolean(message)}
            aria-describedby={`${id}-error`}
            value={currency}
            onChange={onCurrency}
          >
            <option value="" disabled>Currency</option>
            {children}
          </CurrencySelect>
        </div>
      </div>
      <p className={`field-error ${tone === "notice" ? "field-notice" : ""}`} id={`${id}-error`}>
        {message && <><PiWarningCircleBold aria-hidden="true" /> {message}</>}
      </p>
    </div>
  );
}

function OfferPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currencies, error: currenciesError } = useCurrencies();
  const [giveAmount, setGiveAmount] = useState("");
  const [giveCurrency, setGiveCurrency] = useState("");
  const [wantAmount, setWantAmount] = useState("");
  const [wantCurrency, setWantCurrency] = useState("");
  const [flips, setFlips] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // "Paste an offer": free text in, form fields out. Never auto-posts.
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseStatus, setParseStatus] = useState(null); // { key, source, warnings }
  const [source, setSource] = useState(null);
  const [rawInput, setRawInput] = useState("");
  const [focusField, setFocusField] = useState(null);

  const change = (setter, ...fields) => (e) => {
    setter(e.target.value);
    setFieldErrors((current) => {
      const next = { ...current };
      fields.forEach((f) => delete next[f]);
      return next;
    });
  };

  const flip = () => {
    setGiveAmount(wantAmount);
    setWantAmount(giveAmount);
    setGiveCurrency(wantCurrency);
    setWantCurrency(giveCurrency);
    setFieldErrors({});
    setFlips((n) => n + 1);
  };

  const handlePasteChange = (e) => {
    const value = e.target.value;
    setPasteText(value);
    if (parseError) setParseError("");
    // If the text that produced the current fill is gone, the fill no longer describes what's posted.
    if (!value.trim()) {
      setSource(null);
      setRawInput("");
    }
  };

  const handlePasteKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  };

  // Applies a filled-in offer to the form fields: used both by the paste box's parse result and by
  // the assistant panel's "Open in Post offer" prefill. Fills what's given, surfaces warnings under
  // their field (or in the status line for general ones), and focuses the first field still empty.
  const applyFill = ({ fields = {}, warnings = [], source: fillSource, rawInput: fillRawInput = "" }) => {
    const setters = {
      giveAmount: setGiveAmount,
      giveCurrency: setGiveCurrency,
      wantAmount: setWantAmount,
      wantCurrency: setWantCurrency,
    };
    const appliedKeys = Object.keys(fields).filter((k) => fields[k] !== undefined && setters[k]);
    const merged = {
      giveAmount, giveCurrency, wantAmount, wantCurrency,
      ...Object.fromEntries(appliedKeys.map((k) => [k, fields[k]])),
    };
    appliedKeys.forEach((k) => {
      const value = fields[k];
      setters[k](typeof value === "number" ? String(value) : value);
    });

    setFieldErrors((current) => {
      // Notes from an earlier fill don't describe this one; real server errors stay until edited
      const next = Object.fromEntries(Object.entries(current).filter(([, v]) => fieldTone(v) !== "notice"));
      appliedKeys.forEach((k) => delete next[k]);
      warnings.forEach((w) => {
        if (w.field) next[w.field] = { message: w.message, tone: "notice" };
      });
      return next;
    });

    setSource(fillSource);
    setRawInput(fillRawInput);
    // Warnings about a field show under that field; only the general ones belong in the status area
    setParseStatus({ key: Date.now(), source: fillSource, warnings: warnings.filter((w) => !w.field) });

    const missing = FIELD_ORDER.find((k) => !merged[k]);
    if (missing) setFocusField(missing);
  };

  const handleParse = async () => {
    const text = pasteText.trim();
    if (!text || parsing) return;
    setParsing(true);
    setParseError("");
    setParseStatus(null);
    try {
      const res = await api.post("/offer/parse", { text });
      const { fields = {}, warnings = [], source: parsedSource } = res.data;
      applyFill({ fields, warnings, source: parsedSource, rawInput: text });
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) setParseError(err.response?.data?.message || GENERIC_PARSE_ERROR);
      else setParseError(GENERIC_PARSE_ERROR);
    } finally {
      setParsing(false);
    }
  };

  // Arriving from the assistant panel's "Open in Post offer": apply its prefill the same way a
  // paste result is applied, then drop the router state so a refresh or back-nav doesn't redo it.
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;
    setPasteText(prefill.rawInput || "");
    applyFill(prefill);
    navigate(location.pathname, { replace: true, state: null });
    // Only location.key should re-trigger this: it changes on every navigation to /offer, including
    // one that carries a fresh prefill while already on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    if (!focusField) return;
    document.getElementById(FIELD_DOM_ID[focusField])?.focus();
    setFocusField(null);
  }, [focusField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const body = { giveAmount, giveCurrency, wantAmount, wantCurrency };
      if (source && rawInput) {
        body.source = source;
        body.rawInput = rawInput;
      }
      const res = await api.post("/offer", body);
      navigate("/offers", { state: { postedOfferId: res.data.offer._id } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) setFieldErrors(errors);
      else setError(err.response?.data?.message || "Couldn't post the offer. Try again.");
      setSubmitting(false);
    }
  };

  const currencyOptions = useMemo(
    () => currencies.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>),
    [currencies]
  );
  const rate = offerRate({ giveAmount, giveCurrency, wantAmount, wantCurrency });
  const hasAmounts = giveAmount && giveCurrency && wantAmount && wantCurrency;

  return (
    <>
      <Hero
        headline="Post an offer."
        sub="Name the cash you have and how much you want for it. You set the rate; Swap never handles the cash."
      />

      <div className="compose">
        <motion.form className="panel converter" onSubmit={handleSubmit} noValidate {...enter(0)}>
          <div className="paste-offer">
            <p className="eyebrow">Paste an offer</p>
            <p className="hint">Write it the way you'd say it. We'll fill the form, and you check it before posting.</p>
            <label htmlFor="pasteText" className="label" style={{ marginTop: 4 }}>Describe your offer</label>
            <textarea
              id="pasteText"
              className="textarea"
              rows={2}
              maxLength={PASTE_MAX_LENGTH}
              placeholder="I have 250 euros and want 370 Canadian dollars"
              value={pasteText}
              onChange={handlePasteChange}
              onKeyDown={handlePasteKeyDown}
              aria-describedby={parseError ? "paste-error" : undefined}
            />
            <div className="paste-foot">
              {pasteText.length >= 400 && <span>{pasteText.length}/{PASTE_MAX_LENGTH}</span>}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleParse}
              disabled={!pasteText.trim() || parsing}
            >
              {parsing ? "Reading…" : "Fill the form"}
            </button>

            {parseError && (
              <p className="field-error" id="paste-error" role="alert">
                <PiWarningCircleBold aria-hidden="true" /> {parseError}
              </p>
            )}

            <AnimatePresence mode="wait">
              {parseStatus && (
                <motion.div key={parseStatus.key} className="parse-status" {...statusFade}>
                  <p className="parse-status-line">
                    <span className={`tag ${parseStatus.source === "llm" ? "tag-pink" : ""}`}>
                      {parseStatus.source === "llm" ? "AI" : "Rules"}
                    </span>
                    {parseStatus.source === "llm"
                      ? "Filled by AI. Check the amounts before posting."
                      : "Filled by rules."}
                  </p>
                  {parseStatus.warnings.length > 0 && (
                    <ul className="parse-warnings">
                      {parseStatus.warnings.map((w, i) => <li key={i}>{w.message}</li>)}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="paste-divider" />

          <Flash tone="error" message={error || currenciesError} />

          <div className="converter-section">
            <p className="eyebrow" style={{ marginBottom: 12 }}>You have</p>
            <ConverterLeg
              id="giveAmount"
              currencyId="giveCurrencySelect"
              label="Amount"
              currencyLabel="Currency you have"
              amount={giveAmount}
              currency={giveCurrency}
              error={fieldErrors.giveAmount || fieldErrors.giveCurrency}
              onAmount={change(setGiveAmount, "giveAmount")}
              onCurrency={change(setGiveCurrency, "giveCurrency", "wantCurrency")}
            >
              {currencyOptions}
            </ConverterLeg>
          </div>

          <div className="converter-seam">
            <button type="button" className="seam-button" onClick={flip} aria-label="Swap what you have and what you want">
              <motion.span className="seam-icon" animate={{ rotate: flips * 180 }} transition={settle}>
                <PiArrowsDownUpBold aria-hidden="true" />
              </motion.span>
            </button>
          </div>

          <div className="converter-section">
            <p className="eyebrow" style={{ marginBottom: 12 }}>You want</p>
            <ConverterLeg
              id="wantAmount"
              currencyId="wantCurrencySelect"
              label="Amount"
              currencyLabel="Currency you want"
              amount={wantAmount}
              currency={wantCurrency}
              error={fieldErrors.wantAmount || fieldErrors.wantCurrency}
              onAmount={change(setWantAmount, "wantAmount")}
              onCurrency={change(setWantCurrency, "wantCurrency")}
            >
              {currencyOptions}
            </ConverterLeg>
          </div>

          <dl className="converter-summary">
            <div>
              <dt>Your rate</dt>
              <dd>{rate ?? <span className="placeholder">Enter both amounts</span>}</dd>
            </div>
            <div>
              <dt>Swap fee</dt>
              <dd>None. Swap never handles the cash.</dd>
            </div>
          </dl>

          <p className="privacy-note">
            <PiLockSimpleBold size={18} aria-hidden="true" />
            Your email stays private until you accept someone's request.
          </p>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? "Posting…" : "Post offer"}
          </button>
        </motion.form>

        <aside className="preview" aria-label="Preview of your offer">
          <p className="eyebrow">Preview</p>
          <div className="list-card" aria-hidden="true">
            <FlagPair give={giveCurrency} want={wantCurrency} />
            <span className="list-card-body">
              <span className="list-card-title">
                {hasAmounts ? `${formatAmount(giveAmount)} ${giveCurrency} → ${formatAmount(wantAmount)} ${wantCurrency}` : "Enter both amounts"}
              </span>
              <span className="list-card-sub">Your offer</span>
              {rate && <span className="list-card-meta">{rate}</span>}
            </span>
          </div>
          <motion.div className="panel detail-panel" {...enter(1)}>
            <div className="detail-head">
              <FlagPair give={giveCurrency} want={wantCurrency} size={48} />
              <div>
                <p className="detail-title">
                  {hasAmounts
                    ? `You have ${formatAmount(giveAmount)} ${giveCurrency}, want ${formatAmount(wantAmount)} ${wantCurrency}`
                    : "Your offer"}
                </p>
                <p className="detail-sub"><Avatar name={user.name} size={20} /> {user.name}</p>
              </div>
            </div>
          </motion.div>
          <p className="preview-caption">This is how your offer shows up on the Offers page.</p>
        </aside>
      </div>
    </>
  );
}

export default OfferPage;
