export type EventChannel = "mobile" | "web" | "ussd" | "api";

export type EventName =
  | "login"
  | "new_device_login"
  | "password_reset"
  | "pin_change"
  | "beneficiary_created"
  | "transfer_initiated";

export interface NcheEvent {
  event_id: string;
  customer_ref: string;
  event_name: EventName;
  channel: EventChannel;
  occurred_at: string;
  device_ref?: string;
  beneficiary_ref?: string;
  amount?: number;
  metadata?: Record<string, string | number | boolean>;
}
