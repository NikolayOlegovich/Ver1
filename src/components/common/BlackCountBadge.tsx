export function BlackCountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded bg-black text-white text-sm font-medium">
      {value}
    </span>
  );
}

