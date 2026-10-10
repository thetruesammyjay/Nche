"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NcheMascot } from "../../../components/nche-mascot";

export default function DemoPage() {
  const [notice, setNotice] = useState("");

  return (
    <main className="demo-shell">
      <header className="demo-header">
        <Link href="/" className="demo-brand"><Image src="/Nche.png" width={104} height={36} alt="Nche" /><small>DEMO FINANCIAL APP</small></Link>
        <div className="demo-header-actions"><span className="secure-label"><i /> Demo environment</span><Link className="outline-control" href="/login?next=%2Foverview">Open Command <span aria-hidden="true">{"\u2197"}</span></Link></div>
      </header>

      <div className="demo-layout">
        <section className="demo-main-card">
          <div className="demo-card-top"><div><p className="eyebrow">Personal account</p><h1>Good afternoon, Sammy Jay.</h1><p className="muted">Your account ending in <span className="mono">{"\u2022\u2022"} 4821</span></p></div><span className="demo-avatar">CO</span></div>
          <div className="demo-balance"><span>Available balance</span><strong>{"\u20a6"}1,284,500.00</strong><div><span>+{"\u20a6"}320,000 this month</span><span>Last updated 03:11</span></div></div>
          <div className="demo-section-head"><h2>Quick actions</h2><span className="muted">What do you want to do?</span></div>
          <div className="quick-actions">
            <Link href="/demo/transfer"><span aria-hidden="true">{"\u2197"}</span><strong>Make a transfer</strong><small>Send money securely</small></Link>
            <button type="button" onClick={() => setNotice("Airtime and bill actions use the same sequence watch. Start a transfer to see the full risk story.")}><span aria-hidden="true">+</span><strong>Buy airtime</strong><small>Top up a number</small></button>
            <button type="button" onClick={() => setNotice("Bill payments are monitored with the same context. The transfer walkthrough is ready for this demo.")}><span aria-hidden="true">{"\u25a3"}</span><strong>Pay a bill</strong><small>Utilities and services</small></button>
          </div>
          {notice && <div className="demo-notice" role="status"><span className="live-evidence-pulse" aria-hidden="true" /><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={() => setNotice("")}>{"\u00d7"}</button></div>}
          <div className="demo-section-head activity-head"><h2>Recent activity</h2><Link href="#activity">View all {"\u2192"}</Link></div>
          <div id="activity" className="demo-activity">
            <div><span className="activity-icon incoming">{"\u2193"}</span><span><strong>Transfer from Adaobi N.</strong><small>Today, 10:42 {"\u00b7"} Received</small></span><b className="incoming-text">+{"\u20a6"}45,000</b></div>
            <div><span className="activity-icon outgoing">{"\u2191"}</span><span><strong>Electricity bill</strong><small>Yesterday, 16:21 {"\u00b7"} Paid</small></span><b>{"\u2212"}{"\u20a6"}18,500</b></div>
            <div><span className="activity-icon outgoing">{"\u2191"}</span><span><strong>Transfer to Seyi O.</strong><small>04 Sep, 09:14 {"\u00b7"} Sent</small></span><b>{"\u2212"}{"\u20a6"}32,000</b></div>
          </div>
        </section>

        <aside className="demo-aside">
          <div className="demo-aside-note"><NcheMascot compact /><p>For this demo, Nche watches the moments around a sensitive action{"\u2014"}not just the login.</p></div>
          <div className="demo-aside-card"><p className="eyebrow">Try the story</p><h2>Can valid credentials still hide a takeover?</h2><p>Start a transfer. The simulator will introduce the sequence an attacker creates after access.</p><Link href="/demo/transfer" className="cyan-button">Start the transfer <span aria-hidden="true">{"\u2192"}</span></Link></div>
        </aside>
      </div>
      <footer className="demo-footer"><span>Nche demo {"\u00b7"} no real payment is submitted</span><span>Cross-channel risk intelligence</span></footer>
    </main>
  );
}