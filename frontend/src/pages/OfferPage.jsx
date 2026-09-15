import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PiArrowsDownUpBold, PiLockSimpleBold, PiWarningCircleBold } from "react-icons/pi";
import api from "../api";
import { useAuth } from "../AuthContext";
import useCurrencies from "../useCurrencies";
import { Avatar, CurrencySelect, FlagPair, Flash, Hero } from "../ui";
import { formatAmount, offerRate } from "../format";
import { enter, settle } from "../motion";

// One side of the converter: a large amount field with its currency beside it, and the server's complaint below
function ConverterLeg({ id, label, currencyLabel, amount, currency, error, onAmount, onCurrency, children }) {
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
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-error`}
            value={amount}
            onChange={onAmount}
          />
          <CurrencySelect
            className="converter-currency"
            aria-label={currencyLabel}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-error`}
            value={currency}
            onChange={onCurrency}
          >
            <option value="" disabled>Currency</option>
            {children}
          </CurrencySelect>
        </div>
      </div>
      <p className="field-error" id={`${id}-error`}>
        {error && <><PiWarningCircleBold aria-hidden="true" /> {error}</>}
      </p>
    </div>
  );
}

function OfferPage() {
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await api.post("/offer", { giveAmount, giveCurrency, wantAmount, wantCurrency });
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
          <Flash tone="error" message={error || currenciesError} />

          <div className="converter-section">
            <p className="eyebrow" style={{ marginBottom: 12 }}>You have</p>
            <ConverterLeg
              id="giveAmount"
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
