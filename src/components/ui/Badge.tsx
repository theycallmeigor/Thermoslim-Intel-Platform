interface BadgeProps {
  label: string;
  colorClass?: string;
}

export function Badge({ label, colorClass = 'bg-gray-500/10 text-gray-400' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
