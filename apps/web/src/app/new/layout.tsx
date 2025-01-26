import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'New Poll',
};

export default function NewPollLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex justify-center">
			<div className="w-full px-4">{children}</div>
		</div>
	);
}
