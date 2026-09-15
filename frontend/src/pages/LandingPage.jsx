import { Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { PiArrowUpRightBold } from "react-icons/pi";
import { useAuth } from "../AuthContext";
import useCurrencies from "../useCurrencies";
import { Avatar, Flag, FlagPair, ListCard } from "../ui";
import { ease, enter } from "../motion";
import logo from "../assets/logo.svg";

// Three offers a visitor might actually see on Offers, used only as a static, clearly-labeled
// example on the hero (never fetched, never mistaken for real data).
const EXAMPLE_OFFERS = [
  { name: "Amara T.", give: "EUR", want: "CAD", title: "250 EUR → 370 CAD", rate: "1 EUR = 1.48 CAD" },
  { name: "Kwame O.", give: "COP", want: "CAD", title: "3,000,000 COP → 1,050 CAD", rate: "1 CAD = 2,857 COP" },
];

const STEPS = [
  {
    title: "Post what you have and want",
    body: "Say what currency you're holding, what you'd take for it, and how much of each. You name both amounts, so the rate is always yours.",
  },
  {
    title: "Send a request with a note",
    body: "Found an offer that fits? Send a short note about when and where you could meet. A note is optional, but it helps.",
  },
  {
    title: "Accept, and emails are shared",
    body: "The offer's owner accepts or declines. On accept, you both see each other's email and arrange the meetup yourselves.",
  },
];

const FACTS = [
  { term: "Your email", detail: "Stays private until the offer's owner accepts your request." },
  { term: "Your rate", detail: "You set it yourself. Swap never shows a market exchange rate." },
  { term: "Your money", detail: "Swap never holds your cash, and it never charges a fee." },
  { term: "Your meetup", detail: "You pick the time and place, and swap in person, on your terms." },
];

// A section that reveals once as it scrolls into view: 6px rise, 200ms, never repeats.
const reveal = {
  initial: { opacity: 0, y: 6 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.2, ease: ease.out },
};

function LandingPage() {
  const { user, loading } = useAuth();
  const { currencies } = useCurrencies();

  // A saved session is still being checked, or already confirmed: never flash the pitch at
  // someone who's about to land back on Offers.
  if (loading) return null;
  if (user) return <Navigate to="/offers" replace />;

  return (
    <div className="landing">
      <header className="landing-topbar">
        <div className="landing-inner landing-topbar-row">
          <Link to="/" className="landing-brand" aria-label="Swap home">
            <img src={logo} alt="Swap" />
          </Link>
          <nav className="landing-topbar-actions" aria-label="Account">
            <Link to="/login" className="btn btn-quiet">Log in</Link>
            <Link to="/register" className="btn btn-primary">
              <span className="cta-full">Create account</span>
              <span className="cta-short">Sign up</span>
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-inner landing-hero-grid">
          <motion.div className="landing-hero-text" {...enter(0)}>
            <p className="eyebrow">Peer to peer, in person</p>
            <h1 className="landing-headline">Swap the cash you have left over.</h1>
            <p className="landing-lead">
              Post the cash you have and what you'd take for it. See what other people are offering,
              send a request, and meet up once you both agree.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Create account</Link>
              <Link to="/login" className="hero-link">
                Log in <PiArrowUpRightBold aria-hidden="true" />
              </Link>
            </div>
          </motion.div>

          <motion.div className="landing-hero-visual" aria-hidden="true" inert={true} {...enter(2)}>
            <p className="eyebrow landing-visual-label">Example</p>
            <div className="landing-visual-card">
              <div className="landing-visual-list">
                {EXAMPLE_OFFERS.map((o, i) => (
                  <ListCard
                    key={o.name}
                    tile={<FlagPair give={o.give} want={o.want} />}
                    title={o.title}
                    sub={o.name}
                    meta={<span>{o.rate}</span>}
                    selected={i === 0}
                  />
                ))}
              </div>
              <div className="panel detail-panel landing-visual-detail">
                <div className="detail-head">
                  <FlagPair give="EUR" want="CAD" size={44} />
                  <div>
                    <p className="detail-title">You get 370 CAD for 250 EUR</p>
                    <p className="detail-sub">
                      <Avatar name="Amara T." size={20} /> Amara T.
                    </p>
                    <p className="detail-meta">1 EUR = 1.48 CAD</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section className="landing-steps" {...reveal}>
        <div className="landing-inner">
          <p className="eyebrow">How it works</p>
          <div className="landing-step-rail">
            <div className="landing-step">
              <div className="landing-step-text">
                <div className="landing-step-head">
                  <span className="landing-step-index">01</span>
                  <h3>{STEPS[0].title}</h3>
                </div>
                <p>{STEPS[0].body}</p>
              </div>
              <div className="landing-step-visual" aria-hidden="true">
                <ListCard
                  tile={<FlagPair give="EUR" want="CAD" size={36} />}
                  title="250 EUR → 370 CAD"
                  sub="Your offer"
                  meta={<span>Just now</span>}
                />
              </div>
            </div>

            <div className="landing-step">
              <div className="landing-step-text">
                <div className="landing-step-head">
                  <span className="landing-step-index">02</span>
                  <h3>{STEPS[1].title}</h3>
                </div>
                <p>{STEPS[1].body}</p>
              </div>
              <div className="landing-step-visual" aria-hidden="true">
                <div className="detail-note landing-step-note">
                  <blockquote>&ldquo;Could meet near Bloor and Yonge this weekend?&rdquo;</blockquote>
                </div>
              </div>
            </div>

            <div className="landing-step">
              <div className="landing-step-text">
                <div className="landing-step-head">
                  <span className="landing-step-index">03</span>
                  <h3>{STEPS[2].title}</h3>
                </div>
                <p>{STEPS[2].body}</p>
              </div>
              <div className="landing-step-visual landing-step-status" aria-hidden="true">
                <span className="tag status-pending">Pending</span>
                <span>Amara&rsquo;s email is hidden</span>
                <span className="tag status-accepted">Accepted</span>
                <span>amara.t@example.com</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="landing-facts" {...reveal}>
        <div className="landing-inner landing-facts-grid">
          <div className="landing-facts-head">
            <p className="eyebrow">Good to know</p>
            <h2>What Swap does, and doesn't</h2>
          </div>
          <dl className="landing-ledger">
            {FACTS.map((f) => (
              <div className="landing-ledger-row" key={f.term}>
                <dt>{f.term}</dt>
                <dd>{f.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.section>

      <motion.section className="landing-currencies" {...reveal}>
        <div className="landing-inner">
          <p className="eyebrow">Currencies</p>
          <h2>Swap supports cash in these currencies</h2>
          {currencies.length > 0 && (
            <ul className="landing-currency-grid">
              {currencies.map((c) => (
                <li className="landing-currency" key={c.code} title={c.name}>
                  {/* The same round Flag used on Offers, so a currency never looks different here. */}
                  <Flag currency={c.code} size={32} />
                  <span className="landing-currency-code">{c.code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      <motion.section className="landing-cta-band" {...reveal}>
        <div className="landing-inner landing-cta-inner">
          <h2>Have cash left over from a trip?</h2>
          <p>Post what you have, or see what other people are offering.</p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Create account</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Log in</Link>
          </div>
        </div>
      </motion.section>

      <footer className="landing-footer">
        <div className="landing-inner landing-footer-row">
          <Link to="/" className="landing-brand" aria-label="Swap home">
            <img src={logo} alt="Swap" />
          </Link>
          <nav className="landing-footer-links" aria-label="Account">
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
          </nav>
          <p className="landing-footer-note">
            Swap never holds your money, sets rates, or charges fees. You arrange the meetup yourself.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
