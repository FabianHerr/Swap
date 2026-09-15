import { AR, AU, BR, CA, CH, CL, CN, CO, DO, EU, GB, HT, IN, JP, MA, MX, PE, PH, US } from "country-flag-icons/react/1x1";
import { AnimatePresence, motion } from "motion/react";
import {
  PiArrowUpRightBold,
  PiCaretDownBold,
  PiCheckCircleBold,
  PiCoinsBold,
  PiEnvelopeSimpleBold,
  PiGlobeHemisphereWestBold,
  PiLockSimpleBold,
  PiWarningCircleBold,
} from "react-icons/pi";
import { avatarInitials, avatarTint } from "./format";
import { notice, settle, swap } from "./motion";

// The flag people recognize each currency by. XOF is shared by eight countries, so it gets a coin mark instead.
const FLAGS = {
  USD: US, CAD: CA, EUR: EU, GBP: GB, CHF: CH, MXN: MX, COP: CO, ARS: AR, CLP: CL, PEN: PE,
  BRL: BR, DOP: DO, HTG: HT, MAD: MA, JPY: JP, CNY: CN, INR: IN, PHP: PH, AUD: AU,
};

export function Flag({ currency, size = 18 }) {
  const Svg = FLAGS[currency];
  let mark = <PiGlobeHemisphereWestBold />;
  if (Svg) mark = <Svg />;
  else if (currency) mark = <PiCoinsBold />;
  return (
    <span className={`flag ${Svg ? "" : "flag-blank"}`} style={{ "--flag": `${size}px` }} aria-hidden="true">
      {mark}
    </span>
  );
}

// The two currencies of a swap, as overlapping round flags in a rounded-square tile
export function FlagPair({ give, want, size = 40 }) {
  return (
    <span className="flag-pair" style={{ "--tile": `${size}px` }} aria-hidden="true">
      <Flag currency={give} size={size * 0.62} />
      <Flag currency={want} size={size * 0.62} />
    </span>
  );
}

// "600 CAD" with the currency's flag in front, for use inside a sentence
export function Money({ amount, currency }) {
  return (
    <span className="money">
      <Flag currency={currency} size={16} />
      {amount} {currency}
    </span>
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <span className={`select-wrap ${className}`}>
      <select className="select" {...props}>{children}</select>
      <PiCaretDownBold className="select-caret" aria-hidden="true" />
    </span>
  );
}

// A native select with the chosen currency's flag in front of it. The flag pops in when the choice changes.
export function CurrencySelect({ className = "", value, children, ...props }) {
  return (
    <span className={`select-wrap currency-select ${className}`}>
      <span className="select-flag" key={value || "none"}>
        <Flag currency={value} size={20} />
      </span>
      <select className="select" value={value} {...props}>{children}</select>
      <PiCaretDownBold className="select-caret" aria-hidden="true" />
    </span>
  );
}

// Who you'd be meeting, when there's no photo: initials on a tint picked from their name, so the same
// person always looks the same. A squircle, not a circle, so it never reads as one of the round currency flags.
export function Avatar({ name, size = 36, className = "" }) {
  return (
    <span
      className={`avatar avatar-tint-${avatarTint(name)} ${className}`}
      style={{ "--avatar-size": `${size}px` }}
      aria-hidden="true"
    >
      {avatarInitials(name)}
    </span>
  );
}

// One row in the left column of a master-detail page (an offer or a request). `tile` is the leading
// square (a FlagPair or an Avatar); `title`, `sub` and `meta` are the three text lines.
export function ListCard({ tile, title, sub, meta, selected, onClick, ...motionProps }) {
  return (
    <motion.button
      type="button"
      className="list-card"
      aria-current={selected ? "true" : undefined}
      onClick={onClick}
      {...motionProps}
    >
      {tile}
      <span className="list-card-body">
        <span className="list-card-title">{title}</span>
        {sub && <span className="list-card-sub">{sub}</span>}
        {meta && <span className="list-card-meta">{meta}</span>}
      </span>
    </motion.button>
  );
}

export function ListCardSkeleton(props) {
  return (
    <motion.div className="list-card list-card-skeleton" aria-hidden="true" {...props}>
      <span className="bar avatar-skeleton" />
      <span className="list-card-body">
        <span className="bar" style={{ width: "70%" }} />
        <span className="bar" style={{ width: "45%" }} />
        <span className="bar" style={{ width: "55%" }} />
      </span>
    </motion.div>
  );
}

// The sticky right-hand panel, before real content has arrived
export function DetailPanelSkeleton() {
  return (
    <div className="panel detail-panel detail-panel-skeleton" aria-hidden="true">
      <div className="detail-head">
        <span className="bar avatar-skeleton" style={{ width: 56, height: 56 }} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <span className="bar bar-lg" style={{ width: "60%" }} />
          <span className="bar" style={{ width: "40%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <span className="bar" style={{ width: 120, height: 44, borderRadius: 8 }} />
        <span className="bar" style={{ width: 90, height: 44, borderRadius: 8 }} />
      </div>
      <div className="detail-divider" />
      <span className="bar" style={{ width: "30%", marginBottom: 12 }} />
      <span className="bar" style={{ width: "100%", marginBottom: 8 }} />
      <span className="bar" style={{ width: "90%" }} />
    </div>
  );
}

// Request status as a small mono tag. `isNew` fades it in when the status just changed in front of the user.
export function StatusBadge({ status, isNew = false }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={status} className={`tag status-${status}`} {...(isNew ? swap : {})}>
        {status}
      </motion.span>
    </AnimatePresence>
  );
}

// Where the other person's email goes. Locked while pending, opened on accept; the API only sends the email then.
export function ContactSlot({ request, isNew = false }) {
  const { counterpart, status, role } = request;

  if (status === "accepted" && counterpart.email) {
    return (
      <p className={`contact contact-open ${isNew ? "is-new" : ""}`}>
        <PiEnvelopeSimpleBold size={16} aria-hidden="true" />
        <a href={`mailto:${counterpart.email}`}>{counterpart.email}</a>
      </p>
    );
  }

  if (status !== "pending") return null;

  return (
    <p className="contact contact-sealed">
      <PiLockSimpleBold size={16} aria-hidden="true" />
      {role === "owner"
        ? `Accept to share emails with ${counterpart.name}.`
        : `${counterpart.name}'s email shows up here if they accept.`}
    </p>
  );
}

// A count in a small pink mono badge. Renders nothing at zero, so an empty tab or nav item stays plain.
export function Count({ value, label }) {
  if (!value) return null;
  return (
    <span className="count" aria-label={label}>
      {value}
    </span>
  );
}

// Section tabs at the top of a page: mono, uppercase, letter-spaced, with a pink underline that
// slides to whichever tab is active.
export function SectionTabs({ id, label, tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`${id}-${t.key}`}
          aria-selected={t.key === value}
          aria-controls={t.controls}
          className="tab"
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count != null && <Count value={t.count} label={`${t.count} ${t.label.toLowerCase()}`} />}
          {t.key === value && <motion.span layoutId={`${id}-underline`} className="tab-underline" transition={settle} />}
        </button>
      ))}
    </div>
  );
}

// The big display headline at the top of a page: a headline and a muted line, an optional element
// at top right (a link or a button), an optional mono meta line, then a hairline divider.
export function Hero({ headline, sub, topRight, meta, children }) {
  return (
    <div className="hero">
      <div className="hero-row">
        <div className="hero-text">
          {headline && <h1 className="hero-headline">{headline}</h1>}
          {sub && <p className="hero-sub">{sub}</p>}
        </div>
        {topRight && <div className="hero-actions">{topRight}</div>}
      </div>
      {meta && <p className="hero-meta">{meta}</p>}
      {children}
      <div className="hero-divider" />
    </div>
  );
}

// A pink text link with an outward arrow, for the top right of a Hero
export function HeroLink({ children, ...props }) {
  return (
    <a className="hero-link" {...props}>
      {children} <PiArrowUpRightBold aria-hidden="true" />
    </a>
  );
}

// Nothing to show yet: a dashed panel with an icon tile, a mono eyebrow, a title, one sentence and one action
export function EmptyState({ icon: Icon, eyebrow, title, children, action, ...motionProps }) {
  return (
    <motion.div className="empty" {...motionProps}>
      {Icon && <span className="empty-icon" aria-hidden="true"><Icon /></span>}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </motion.div>
  );
}

// A message under the page heading that slides in, and out again when it's cleared
export function Flash({ tone = "ok", message }) {
  const Icon = tone === "ok" ? PiCheckCircleBold : PiWarningCircleBold;
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p key={message} className={`flash flash-${tone}`} role={tone === "ok" ? "status" : "alert"} {...notice}>
          <Icon size={18} aria-hidden="true" /> {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// The left side of Log in and Sign up: what Swap is, and a real example rendered small, clearly
// labeled EXAMPLE so it's never mistaken for a real offer.
export function AuthIntro({ logo }) {
  return (
    <aside className="auth-panel-inner" aria-label="About Swap">
      <div className="auth-logo">
        <img src={logo} alt="Swap" />
      </div>
      <p className="auth-display">Swap the cash you have left over.</p>
      <p className="auth-lead">Post the cash you have and what you want for it. Emails stay private until you accept a request.</p>

      <div className="auth-example">
        <p className="eyebrow auth-example-label">Example</p>
        <div className="auth-example-card">
          <div className="list-card" aria-hidden="true">
            <FlagPair give="EUR" want="CAD" size={40} />
            <span className="list-card-body">
              <span className="list-card-title">250 EUR &rarr; 370 CAD</span>
              <span className="list-card-sub">Amara T.</span>
              <span className="list-card-meta">1 EUR = 1.48 CAD &middot; 2d ago</span>
            </span>
          </div>
          <div className="panel detail-panel" aria-hidden="true">
            <div className="detail-head">
              <FlagPair give="EUR" want="CAD" size={48} />
              <div>
                <p className="detail-title">You get 370 CAD for 250 EUR</p>
                <p className="detail-sub">Amara T.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
