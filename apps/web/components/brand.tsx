import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? "brand-compact" : ""}`}><Image src="/Nche.png" alt="Nche" width={104} height={36} priority /></span>;
}