"use client";

import { cn } from "@/lib/cn";
import { useChainStore } from "@/lib/stores/chain";

export function ChainStatus() {
  const [blockHeight, loading, online] = useChainStore((state) => [
    state.block?.height,
    state.loading,
    state.online,
  ]);

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "mr-1 h-2 w-2 rounded-full",
          loading ? "bg-yellow-500" : online ? "bg-green-500" : "bg-red-500",
        )}
      ></div>
      <div className="text-xs text-slate-600">{blockHeight ?? "-"}</div>
    </div>
  );
}
