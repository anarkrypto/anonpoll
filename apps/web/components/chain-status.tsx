'use client';

import { useChain } from '@zeropoll/react';
import { cn } from '@/lib/cn';

export function ChainStatus() {
	const { block, loading, online } = useChain();

	return (
		<div className="flex items-center">
			<div
				className={cn(
					'mr-1 h-2 w-2 rounded-full',
					loading ? 'bg-yellow-500' : online ? 'bg-green-500' : 'bg-red-500'
				)}
			></div>
			<div className="hidden text-xs text-slate-600 sm:block">
				{block.height ?? '-'}
			</div>
		</div>
	);
}
