'use client'

import { useChainStore } from "@/lib/stores/chain";

export function ChainStatus() {

  const blockHeight = useChainStore((state) => state.block?.height);

  return (
    <div className="flex items-center">
      <div className={"mr-1 h-2 w-2 rounded-full bg-green-500"}></div>
      <div className="text-xs text-slate-600">{blockHeight ?? "-"}</div>
    </div>
  );
}
