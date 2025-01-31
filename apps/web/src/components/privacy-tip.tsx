import { cn } from '@/lib/cn';
import { InfoIcon } from 'lucide-react';

export function PrivacyTip(props: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={cn('mx-auto w-full max-w-xl', props.className)}>
			<div className="flex justify-center gap-x-2 rounded-lg bg-blue-100 p-3 text-center text-xs text-blue-800">
				<InfoIcon className="h-4 w-4" /> For full privacy consider using a VPN
			</div>
		</div>
	);
}
