"use client";

import { useEffect, useState } from "react";
import type { Institution, InstitutionPolicy } from "@nche/types";

type FormState = Pick<InstitutionPolicy, "challenge_from" | "review_from" | "block_from">;

export function InstitutionPolicyPanel() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionRef, setInstitutionRef] = useState("");
  const [form, setForm] = useState<FormState>({ challenge_from: 30, review_from: 60, block_from: 80 });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/institutions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Institution directory is unavailable.");
        return (await response.json()) as Institution[];
      })
      .then((items) => { setInstitutions(items); setInstitutionRef(items[0]?.institution_ref ?? ""); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Institution directory is unavailable."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!institutionRef) return;
    setMessage("");
    setError("");
    fetch(`/api/institutions/${encodeURIComponent(institutionRef)}/policy`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Institution policy is unavailable.");
        return (await response.json()) as InstitutionPolicy;
      })
      .then((policy) => setForm({ challenge_from: policy.challenge_from, review_from: policy.review_from, block_from: policy.block_from }))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Institution policy is unavailable."));
  }, [institutionRef]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: Number(value) }));
    setMessage("");
  }

  async function save() {
    if (!(form.challenge_from < form.review_from && form.review_from < form.block_from)) {
      setError("Thresholds must increase from challenge to review to block.");
      return;
    }
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/institutions/${encodeURIComponent(institutionRef)}/policy`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => null)) as InstitutionPolicy | { detail?: string } | null;
      if (!response.ok) throw new Error(body && "detail" in body ? body.detail : "Policy could not be saved.");
      setMessage("Policy saved for this institution.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Policy could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return <section className="panel settings-panel"><div className="panel-heading"><div><p className="eyebrow">Decision bands</p><h2>Institution policy</h2></div><span className="provenance-tag is-live">PERSISTENT</span></div><p className="muted">Each institution can choose when Nche recommends challenge, review, or block. The engine score stays the same; the institution owns the response bands.</p><label className="field-label">Institution<select value={institutionRef} onChange={(event) => setInstitutionRef(event.target.value)} disabled={loading || institutions.length === 0}><option value="">Select an institution</option>{institutions.map((institution) => <option value={institution.institution_ref} key={institution.institution_ref}>{institution.name}</option>)}</select></label><div className="setting-row"><div><strong>Challenge from</strong><small>Ask for additional verification</small></div><output className="range-value">{form.challenge_from}</output></div><input className="range" type="range" min="0" max="99" value={form.challenge_from} onChange={(event) => update("challenge_from", event.target.value)} disabled={!institutionRef || pending} aria-label="Challenge threshold" /><div className="setting-row"><div><strong>Review from</strong><small>Hold for an analyst</small></div><output className="range-value">{form.review_from}</output></div><input className="range" type="range" min="1" max="99" value={form.review_from} onChange={(event) => update("review_from", event.target.value)} disabled={!institutionRef || pending} aria-label="Review threshold" /><div className="setting-row"><div><strong>Block from</strong><small>Stop the sensitive action</small></div><output className="range-value">{form.block_from}</output></div><input className="range" type="range" min="2" max="100" value={form.block_from} onChange={(event) => update("block_from", event.target.value)} disabled={!institutionRef || pending} aria-label="Block threshold" />{error && <p className="inline-error" role="alert">{error}</p>}{message && <p className="inline-success" role="status">{message}</p>}<button className="cyan-button" type="button" onClick={() => void save()} disabled={!institutionRef || pending || loading}>{pending ? "Saving policy…" : "Save institution policy"}</button></section>;
}
