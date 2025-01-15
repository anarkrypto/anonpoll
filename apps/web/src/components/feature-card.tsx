import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
	title: string;
	description: string;
	Icon: LucideIcon;
}

export function FeatureCard({ title, description, Icon }: FeatureCardProps) {
	return (
		<div className="card-3d rounded-lg bg-white p-6">
			<Icon className="mb-4 h-8 w-8 text-primary" />
			<h3 className="mb-2 text-xl font-semibold text-zinc-800">{title}</h3>
			<p className="text-zinc-600">{description}</p>
		</div>
	);
}
