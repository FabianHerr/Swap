import React, { useState } from "react";
import axios from "axios";

function OfferPage() {
  const [giveCurrency, setCurrency] = useState("");
  const [receiveAmount, setAmount] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
     const res = await axios.post("http://localhost:3001/offer", {
      amount: receiveAmount,              
      currency: giveCurrency,             
      currencyToReceive: receiveCurrency, 
    });

      setMessage("✅ Offer posted successfully!");
      console.log("Response:", res.data);


      setCurrency("");
      setAmount("");
      setReceiveCurrency("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error posting offer");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title mb-4">Post an Offer</h2>

          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-control"
                value={receiveAmount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
              <div className="mb-3">
              <label className="form-label">Currency You Give</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. USD"
                value={giveCurrency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Currency You Want</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CAD"
                value={receiveCurrency}
                onChange={(e) =>
                  setReceiveCurrency(e.target.value.toUpperCase())
                }
                required
              />
            </div>

         

            <button type="submit" className="btn btn-primary w-100">
              Post Offer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OfferPage;
