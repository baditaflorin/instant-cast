import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: "primary" | "quiet" | "danger";
}

const toneClass = {
  primary: "bg-sea text-white hover:bg-[#08565a]",
  quiet: "bg-white text-ink ring-1 ring-black/10 hover:bg-black/[0.04]",
  danger: "bg-coral text-white hover:bg-[#bd4e36]",
};

export function IconButton({
  label,
  icon,
  tone = "quiet",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass[tone]} ${className}`}
      {...props}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
