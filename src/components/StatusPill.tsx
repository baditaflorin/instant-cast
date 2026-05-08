interface StatusPillProps {
  children: string;
  tone?: "ready" | "busy" | "warn";
}

const toneClass = {
  ready: "bg-fern/10 text-fern",
  busy: "bg-sea/10 text-sea",
  warn: "bg-coral/10 text-coral",
};

export function StatusPill({ children, tone = "ready" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
