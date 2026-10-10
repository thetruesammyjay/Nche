"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NcheMascot } from "../components/nche-mascot";

type Scenario = "takeover" | "normal";
const examples = {
  takeover: {
    title: "Suspected account takeover",
    description: "A new device, a new recipient, and a large transfer happen minutes apart.",
    events: [
      ["03:12", "New device signs in", "Device not seen on this account"],
      ["03:13", "New beneficiary added", "First payment to this recipient"],
      ["03:14", "₦1,000,000 transfer", "About 78% of the available balance"],
    ],
    recommendation: "Review or block",
    reason: "The new device, recipient, and unusually large transfer form a risky sequence.",
    tone: "critical",
  },
  normal: {
    title: "Familiar transfer",
    description: "A customer pays a known recipient from a device they regularly use.",
    events: [
      ["03:12", "Known device signs in", "Previously used on this account"],
      ["03:13", "Saved beneficiary selected", "Recipient paid before"],
      ["03:14", "₦25,000 transfer", "Within the customer’s usual range"],
    ],
    recommendation: "Allow",
    reason: "The device, recipient, and amount match familiar account activity.",
    tone: "safe",
  },
} as const;

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("takeover");
  const [visibleEvents, setVisibleEvents] = useState(2);
  const active = examples[scenario];
  const closeMenu = () => setMenuOpen(false);
  const selectScenario = (next: Scenario) => { setScenario(next); setVisibleEvents(2); };

  return (
    <main className="landing">
      <nav className={`landing-nav ${menuOpen ? "menu-open" : ""}`} aria-label="Main navigation">
        <Link href="/" className="landing-brand" onClick={closeMenu}><Image src="/Nche.png" width={104} height={36} alt="Nche" priority /></Link>
        <div className="landing-links"><a href="#why" onClick={closeMenu}>Why Nche</a><a href="#command" onClick={closeMenu}>Product example</a><a href="#how" onClick={closeMenu}>How it works</a></div>
        <div className="landing-actions"><Link href="/login?next=%2Foverview" className="nav-quiet">Analyst sign in</Link><Link href="/demo" className="nav-cta">Run the demo <span aria-hidden="true">↗</span></Link></div>
        <button className="landing-menu" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="landing-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
        <div id="landing-mobile-menu" className={`landing-mobile-menu ${menuOpen ? "is-open" : ""}`} inert={!menuOpen}>
          <div className="landing-mobile-links"><a href="#why" onClick={closeMenu}>Why Nche <span>↓</span></a><a href="#command" onClick={closeMenu}>Product example <span>↓</span></a><a href="#how" onClick={closeMenu}>How it works <span>↓</span></a><Link href="/demo" className="nav-cta" onClick={closeMenu}>Run the demo <span>↗</span></Link><Link href="/login?next=%2Foverview" onClick={closeMenu}>Analyst sign in <span>↗</span></Link></div>
        </div>
      </nav>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="hero-kicker"><span className="kicker-dot" /> Account-takeover intelligence · Built for Nigeria</p>
          <h1>The password is correct.<br /><span className="headline-highlight">The customer is not.</span></h1>
          <p className="hero-lead">Nche helps financial institutions spot suspicious activity after login, before a transfer goes through. It shows the evidence and recommends a next step; the institution makes the decision.</p>
          <div className="hero-actions"><Link href="/demo" className="hero-cta">Run the demo <span aria-hidden="true">↗</span></Link><Link href="/login?next=%2Foverview" className="hero-secondary">Analyst sign in <span aria-hidden="true">→</span></Link></div>
          <p className="hero-note">A guided simulation. No real payment is sent.</p>
        </div>
        <div className="hero-example" aria-label="Illustrative account takeover example">
          <div className="hero-example-head"><span>ILLUSTRATIVE DEMO · TRANSFER ANALYSIS</span><NcheMascot compact /></div>
          <div className="hero-example-events"><div><span>01</span><strong>New login</strong><small>New device</small></div><div><span>02</span><strong>New beneficiary</strong><small>First seen</small></div><div><span>03</span><strong>₦1m transfer</strong><small>78% of balance</small></div></div>
          <div className="hero-example-decision"><span>NCHE RECOMMENDS</span><strong>Review or block</strong><p>Three linked signals turn an ordinary-looking login into a case for action.</p></div>
        </div>
      </section>
      <section id="command" className="product-preview">
        <div className="example-intro"><div><p className="eyebrow">See how the decision changes</p><h2>Same product. Different context.</h2><p>Choose a sample transfer to see the sequence, evidence, and recommendation Nche would surface.</p></div><span>Illustrative demo · Simulated events</span></div>
        <div className="scenario-switch" role="group" aria-label="Choose a sample transfer"><button type="button" aria-pressed={scenario === "takeover"} onClick={() => selectScenario("takeover")}>Suspected takeover</button><button type="button" aria-pressed={scenario === "normal"} onClick={() => selectScenario("normal")}>Normal transfer</button></div>
        <div className={`scenario-panel scenario-${visibleEvents === active.events.length ? active.tone : "pending"}`}>
          <div className="scenario-overview"><span>NCHE COMMAND / EXAMPLE ANALYSIS</span><h3>{active.title}</h3><p>{active.description}</p></div>
          <div className="scenario-content"><div className="scenario-evidence"><div className="scenario-section-heading"><strong>Event sequence</strong><span>{visibleEvents} of {active.events.length} events</span></div><div className="scenario-events" aria-live="polite" key={scenario}>{active.events.slice(0, visibleEvents).map(([time, title, detail], index) => <div className="scenario-event" key={title} style={{ animationDelay: `${index * 65}ms` }}><span className="scenario-event-index">0{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>)}</div>{visibleEvents < active.events.length && <button className="scenario-add" type="button" onClick={() => setVisibleEvents(visibleEvents + 1)}>Add transfer event <span aria-hidden="true">→</span></button>}</div><div className="scenario-decision" aria-live="polite" key={`${scenario}-${visibleEvents}`}><span>Nche recommendation</span>{visibleEvents === active.events.length ? <><strong>{active.recommendation}</strong><p>{active.reason}</p></> : <><strong>Waiting for transfer</strong><p>Add the transfer event to see how Nche evaluates the complete sequence.</p></>}<small>The institution makes the final decision.</small></div></div>
        </div>
        <p className="preview-caption">This example uses simulated events. <Link href="/demo">Try the full transfer demo →</Link></p>
      </section>
      <section id="why" className="landing-section split-section"><div className="section-copy"><p className="eyebrow">The problem after login</p><h2>Authentication succeeded <span>≠</span> ownership is certain.</h2><p>Fraudsters can have the right password and still be the wrong person. Nche connects the device, recipient, amount, and timing so a financial institution can decide what to do next.</p><Link href="/demo" className="text-link">Walk through a takeover <span>→</span></Link></div><div className="signal-card"><div className="signal-card-head"><span>EXAMPLE / CUSTOMER SEQUENCE</span><span>SIMULATED</span></div><div className="signal-card-main"><div className="signal-score"><strong>3</strong><span>linked events</span></div><div className="signal-copy"><b>Account takeover pattern</b><p>Each signal can look ordinary on its own. Together, they call for a closer look.</p></div></div><div className="signal-foot"><span>Next step</span><strong>Review or block</strong></div></div></section>
      <section id="how" className="landing-section principles"><div className="section-heading"><p className="eyebrow">What Nche brings together</p><h2>Behaviour is a sequence, not a single event.</h2></div><div className="principle-grid"><article><span>01</span><h3>Cross-channel context</h3><p>Mobile, web, and USSD activity brought into one customer timeline.</p></article><article><span>02</span><h3>Beneficiary intelligence</h3><p>Recipient novelty, transfer size, and customer behaviour considered together.</p></article><article><span>03</span><h3>Explainable decisions</h3><p>Recommendations come with evidence an analyst can review and explain.</p></article></div></section>
      <section className="landing-bottom"><div><p className="eyebrow">See Nche in action</p><h2>Make the next decision<br /><span>legible.</span></h2></div><Link href="/demo" className="hero-cta">Run the demo <span>↗</span></Link></section>
      <footer className="landing-footer"><span>© 2026 Nche Risk Intelligence</span><span>Decision support. Institution-owned authority.</span><span>Built for the Nigerian digital economy.</span></footer>
    </main>
  );
}
