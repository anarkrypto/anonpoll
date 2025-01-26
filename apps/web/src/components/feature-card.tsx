import { cn } from '@/lib/cn';
import { LucideIcon } from 'lucide-react';
import { HTMLAttributes } from 'react';

interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	description: string;
	Icon: LucideIcon;
}

export function FeatureCard({
	title,
	description,
	Icon,
	...props
}: FeatureCardProps) {
	return (
		<div
			{...props}
			className={cn(
				'rounded-lg border border-zinc-200 bg-white p-6',
				props.className
			)}
		>
			<Icon className="mb-4 h-8 w-8 text-primary" />
			<h3 className="mb-2 text-xl font-semibold text-zinc-800">{title}</h3>
			<p className="text-zinc-600">{description}</p>
		</div>
	);
}
