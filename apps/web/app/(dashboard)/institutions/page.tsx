"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Institution, InstitutionCreate, InstitutionType } from "@nche/types";
import { PageIntro } from "../../../components/command-ui";
import { apiClient } from "../../../lib/api-client";

const institutionTypes: Array<{ value: InstitutionType; label: string }> = [
  { value: "bank", label: "Commercial bank" },
  { value: "fintech", label: "Fintech" },
  { value: "microfinance", label: "Microfinance bank" },
  { value: "wallet", label: "Wallet" },
  { value: "cooperative", label: "Cooperative" },
];

const initialForm: InstitutionCreate = { institution_ref: "", name: "", institution_type: "bank" };

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [form, setForm] = useState<InstitutionCreate>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.listInstitutions().then(setInstitutions).catch(() => setError("The institution directory could not be reached.")).finally(() => setLoading(false));
  }, []);

  async function addInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await apiClient.createInstitution({ ...form, institution_ref: form.institution_ref.trim().toLowerCase().replaceAll(" ", "_") });
      setInstitutions((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(initialForm);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message.replace("Nche API request failed: ", "") : "The institution could not be added.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-page">
      <PageIntro eyebrow="Nche Command / Institutions" title="Institution directory" description="Connect the banks, fintechs, and wallets whose sensitive actions you evaluate." action={<Link className="cyan-button" href="/evaluation/new">Run an analysis <span aria-hidden="true">→</span></Link>} />
      <div className="institution-layout">
        <section className="panel institution-list-panel">
          <div className="panel-heading"><div><p className="eyebrow">Available workspaces</p><h2>{loading ? "Loading institutions" : `${institutions.length} institutions ready`}</h2></div><span className="provenance-tag">DEMO DIRECTORY</span></div>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {!loading && institutions.length === 0 && <div className="empty-state"><span>+</span><h3>No institutions yet</h3><p>Add the first institution to start an analysis.</p></div>}
          <div className="institution-list">
            {institutions.map((institution) => (
              <article className="institution-row" key={institution.institution_ref}>
                <span className="institution-mark">{institution.name.slice(0, 1)}</span>
                <div><strong>{institution.name}</strong><small className="mono">{institution.institution_ref}</small></div>
                <span className="institution-type">{institution.institution_type}</span>
                <span className="institution-status"><i />{institution.status}</span>
              </article>
            ))}
          </div>
        </section>
        <section className="panel institution-form-panel">
          <p className="eyebrow">Add an institution</p>
          <h2>Open another workspace</h2>
          <p className="muted">Each analysis carries the selected institution reference into the risk decision and evidence record.</p>
          <form className="institution-form" onSubmit={addInstitution}>
            <label className="field-label">Institution name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Northstar Bank" required /></label>
            <label className="field-label">Reference key<input value={form.institution_ref} onChange={(event) => setForm({ ...form, institution_ref: event.target.value })} placeholder="northstar_bank" pattern="[a-z0-9][a-z0-9_-]*" required /><small className="field-help">Lowercase letters, numbers, underscores, or hyphens.</small></label>
            <label className="field-label">Institution type<select value={form.institution_type} onChange={(event) => setForm({ ...form, institution_type: event.target.value as InstitutionType })}>{institutionTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label>
            {error && <p className="inline-error" role="alert">{error}</p>}
            <button className="cyan-button full-width" type="submit" disabled={saving}>{saving ? "Adding institution…" : "Add institution →"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
