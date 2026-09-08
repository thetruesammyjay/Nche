"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Decision } from "@nche/types";
import { DecisionBadge, RiskScore } from "@nche/ui";

type Alert = { id: string; customer: string; channel: string; score: number; level: "high" | "critical"; decision: Decision; reason: string; time: string; status: string };
const alerts: Alert[] = [
  { id: "ALT-4B19", customer: "customer_7fd9a2", channel: "WEB", score: 96, level: "critical", decision: "BLOCK", reason: "Account takeover sequence", time: "2m ago", status: "New" },
  { id: "ALT-4B17", customer: "customer_2a9c10", channel: "USSD", score: 84, level: "critical", decision: "REVIEW", reason: "Recovery + PIN change", time: "14m ago", status: "Assigned" },
  { id: "ALT-4B03", customer: "customer_1de88f", channel: "MOBILE", score: 78, level: "high", decision: "REVIEW", reason: "Beneficiary novelty", time: "28m ago", status: "New" },
  { id: "ALT-4AF2", customer: "customer_91bc20", channel: "WEB", score: 73, level: "high", decision: "CHALLENGE", reason: "Unusual transfer velocity", time: "41m ago", status: "Assigned" },
  { id: "ALT-4AE7", customer: "customer_08e1d2", channel: "MOBILE", score: 68, level: "high", decision: "REVIEW", reason: "First-time recipient", time: "1h ago", status: "New" },
  { id: "ALT-4AC1", customer: "customer_3a77b1", channel: "WEB", score: 62, level: "high", decision: "CHALLENGE", reason: "Device mismatch", time: "2h ago", status: "Resolved" },
];

export function AlertQueue() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Decision>("All");
  const filtered = useMemo(() => alerts.filter((alert) => (filter === "All" || alert.decision === filter) && `${alert.customer} ${alert.reason} ${alert.id}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);
  return <div className="alert-queue"><div className="queue-toolbar"><div className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts, customers, or IDs" /></div><div className="filter-pills">{(["All", "BLOCK", "REVIEW", "CHALLENGE"] as const).map((item) => <button className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item)}>{item === "All" ? "All alerts" : item}</button>)}</div></div><div className="alert-table-wrap"><table className="alert-table"><thead><tr><th>Alert</th><th>Customer</th><th>Channel</th><th>Risk</th><th>Decision</th><th>Primary reason</th><th>Age</th><th>Status</th></tr></thead><tbody>{filtered.map((alert) => <tr key={alert.id}><td><Link href={`/investigations/${alert.id.toLowerCase()}`} className="table-link mono">{alert.id}</Link></td><td className="mono customer-ref">{alert.customer}</td><td><span className="channel-chip">{alert.channel}</span></td><td><RiskScore score={alert.score} decision={alert.decision} level={alert.level} compact /></td><td><DecisionBadge decision={alert.decision} /></td><td>{alert.reason}</td><td className="muted">{alert.time}</td><td><span className={`status-label status-${alert.status.toLowerCase()}`}>{alert.status}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><span>⌕</span><h3>No alerts found</h3><p>Try a different customer reference, reason, or decision filter.</p></div>}</div><div className="queue-footer"><span>Showing {filtered.length} of {alerts.length} alerts</span><button className="ghost-button">Load older alerts →</button></div></div>;
}
