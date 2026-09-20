export type InstitutionType = "bank" | "fintech" | "microfinance" | "wallet" | "cooperative";

export interface Institution {
  institution_ref: string;
  name: string;
  institution_type: InstitutionType;
  status: string;
  created_at: string;
}

export interface InstitutionCreate {
  institution_ref: string;
  name: string;
  institution_type: InstitutionType;
}
