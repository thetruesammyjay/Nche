import { CommandShell } from "../../components/command-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CommandShell>{children}</CommandShell>;
}