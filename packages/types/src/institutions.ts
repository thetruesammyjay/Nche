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

export interface InstitutionPolicy {
  institution_ref: string;
  challenge_from: number;
  review_from: number;
  block_from: number;
  updated_at: string;
  updated_by?: string | null;
}
