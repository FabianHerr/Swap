import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useCurrencies from "../useCurrencies";

function OfferPage() {
  const navigate = useNavigate();
  const { currencies, error: currenciesError } = useCurrencies();
  const [amount, setAmount] = useState("");
  const [giveCurrency, setGiveCurrency] = useState("");
  const [wantCurrency, setWantCurrency] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await api.post("/offer", { amount, giveCurrency, wantCurrency });
      navigate("/offers", { state: { postedOfferId: res.data.offer._id } });
    } catch (err) {
      // The server is the validator; show its per-field messages next to their fields,
      // and use the banner only for errors that don't belong to a field
      const errors = err.response?.data?.errors;
      if (errors) setFieldErrors(errors);
      else setError(err.response?.data?.message || "Couldn't post the offer. Try again.");
      setSubmitting(false);
    }
  };

  const currencyOptions = currencies.map((c) => (
    <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
  ));

  return (
    <div className="container py-5" style={{ maxWidth: "560px" }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title mb-1">Post an offer</h2>
          <p className="text-muted mb-4">Say what cash you have and what you want for it.</p>

          {(error || currenciesError) && <div className="alert alert-danger">{error || currenciesError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="amount" className="form-label fw-bold">You give</label>
            <div className="input-group mb-1">
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className={`form-control ${fieldErrors.amount ? "is-invalid" : ""}`}
                placeholder="Amount, e.g. 300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <select
                aria-label="Currency you give"
                className={`form-select ${fieldErrors.giveCurrency ? "is-invalid" : ""}`}
                style={{ maxWidth: "45%" }}
                value={giveCurrency}
                onChange={(e) => setGiveCurrency(e.target.value)}
                required
              >
                <option value="" disabled>Currency</option>
                {currencyOptions}
              </select>
            </div>
            <div className="small text-danger mb-3" style={{ minHeight: "1.25rem" }}>
              {fieldErrors.amount || fieldErrors.giveCurrency}
            </div>

            <label htmlFor="wantCurrency" className="form-label fw-bold">You want</label>
            <select
              id="wantCurrency"
              className={`form-select mb-1 ${fieldErrors.wantCurrency ? "is-invalid" : ""}`}
              value={wantCurrency}
              onChange={(e) => setWantCurrency(e.target.value)}
              required
            >
              <option value="" disabled>Currency</option>
              {currencyOptions}
            </select>
            <div className="small text-danger mb-3" style={{ minHeight: "1.25rem" }}>
              {fieldErrors.wantCurrency}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? "Posting…" : "Post offer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OfferPage;
