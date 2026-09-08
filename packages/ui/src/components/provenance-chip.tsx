export function ProvenanceChip({ source }: { source: "SIMULATED" | "NIBSS SIM SWAP SERVICE" | "UNKNOWN" }) { return <span className="provenance-chip">SIM Intelligence · {source}</span>; }
