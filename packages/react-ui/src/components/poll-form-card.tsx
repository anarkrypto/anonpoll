'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	ArrowRight,
	GlobeIcon,
	LockIcon,
	PlusIcon,
	TrashIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useState } from 'react';
import { PollMetadata, pollMetadataSchema } from '@zeropoll/core/schemas';
import { MAX_POLL_OPTIONS, MAX_POLL_VOTERS } from '@zeropoll/core/constants';
import { useCreatePoll, UseCreatePollOptions } from '@zeropoll/react';
import { cn } from '@/lib/cn';
import { generateSalt, isValidPublicKey } from '@zeropoll/core/utils';

// Types
export type PollFormCardProps = {
	className?: string | undefined;
} & UseCreatePollOptions;

type PollPrivacy = 'public' | 'private';
type Step = (typeof STEPS)[keyof typeof STEPS];

// Constants
const STEPS = {
	PRIVACY: 0 as const,
	POLL: 1 as const,
	VOTERS: 2 as const,
};

const STEP_TITLES: Record<Step, string> = {
	[STEPS.PRIVACY]: 'Select Poll Privacy',
	[STEPS.POLL]: 'Create a New Poll',
	[STEPS.VOTERS]: 'Add Voters Wallets',
};

// Utilities
const checkDuplicateOptions = (options: string[]): string | null => {
	const seen = new Set<string>();
	for (const option of options) {
		if (seen.has(option)) return option;
		seen.add(option);
	}
	return null;
};

export function PollFormCard({
	className,
	onSuccess,
	onError,
}: PollFormCardProps) {
	const [step, setStep] = useState<Step>(STEPS.PRIVACY);
	const [privacy, setPrivacy] = useState<PollPrivacy | null>(null);

	const form = useForm<PollMetadata>({
		defaultValues: {
			title: '',
			description: '',
			options: [],
			votersWallets: [],
			salt: generateSalt(),
		},
		resolver:
			step !== STEPS.PRIVACY
				? zodResolver(
						step === STEPS.POLL
							? pollMetadataSchema.omit({ votersWallets: true, salt: true })
							: pollMetadataSchema
					)
				: undefined,
	});

	const {
		createPoll,
		isPending: creatingPoll,
		isSuccess,
	} = useCreatePoll({
		onSuccess,
		onError,
	});

	const handlePrivacyChange = useCallback((selectedPrivacy: PollPrivacy) => {
		setPrivacy(selectedPrivacy);
	}, []);

	const handleSubmit = useCallback(
		async (data: PollMetadata) => {
			try {
				if (step === STEPS.PRIVACY) {
					if (!privacy) return;
					setStep(STEPS.POLL);
					return;
				}

				if (step === STEPS.POLL) {
					const duplicateOption = checkDuplicateOptions(data.options);
					if (duplicateOption) {
						form.setError('options', {
							type: 'duplicate',
							message: `Duplicate option found: ${duplicateOption}`,
						});
						return;
					}

					if (privacy === 'private') {
						setStep(STEPS.VOTERS);
						return;
					}

					// Public poll submission
					await createPoll({
						...data,
						salt: generateSalt(),
						votersWallets: [],
					});
					return;
				}

				// Final submission for private polls
				await createPoll({ ...data, salt: generateSalt() });
			} catch (error) {
				console.error({ error });
				onError?.(
					error instanceof Error ? error.message : 'Unknown error occurred'
				);
			}
		},
		[step, privacy, createPoll, form, onError]
	);

	const renderStepContent = () => {
		switch (step) {
			case STEPS.PRIVACY:
				return <PrivacyStep onChange={handlePrivacyChange} />;
			case STEPS.POLL:
				return <PollStep form={form} />;
			case STEPS.VOTERS:
				return <VotersWalletsStep form={form} max={MAX_POLL_VOTERS} />;
			default:
				return null;
		}
	};

	const renderButtonContent = () => {
		if (
			step === STEPS.PRIVACY ||
			(step === STEPS.POLL && privacy === 'private')
		) {
			return (
				<>
					Next
					<ArrowRight className="ml-2 h-4 w-4" />
				</>
			);
		}
		return 'Create Poll';
	};

	return (
		<Card
			className={cn(
				'mx-auto max-w-2xl rounded-lg bg-white shadow-md lg:p-6',
				className
			)}
		>
			<CardHeader>
				<CardTitle className="text-center text-2xl text-secondary">
					{STEP_TITLES[step]}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						{renderStepContent()}

						<Button
							type="submit"
							className="w-full"
							disabled={
								creatingPoll ||
								form.formState.isSubmitting ||
								isSuccess ||
								!privacy
							}
						>
							{renderButtonContent()}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function PrivacyStep({
	onChange,
}: {
	onChange?: (privacy: PollPrivacy) => void;
}) {
	const [privacy, setPrivacy] = useState<PollPrivacy | null>(null);

	const options = [
		{
			value: 'public',
			icon: <GlobeIcon className="h-5 w-5 text-zinc-500" />,
			title: 'Public Poll',
			description: 'Votes are anonymous, but anyone can find the poll and vote',
		},
		{
			value: 'private',
			icon: <LockIcon className="h-5 w-5 text-zinc-500" />,
			title: 'Private Poll',
			description:
				'Votes are anonymous, poll is encrypted and only specific wallets can vote',
		},
	];

	const handleOnChange = (privacy: PollPrivacy) => {
		setPrivacy(privacy);
		onChange?.(privacy);
	};

	return (
		<FormItem className="space-y-4">
			{options.map(option => (
				<FormItem
					key={option.value}
					className={cn(
						'group flex items-center space-x-3 space-y-0 hover:bg-primary/10 rounded-lg p-4 border-2 border-zinc-200 select-none cursor-pointer hover:border-primary/50',
						privacy === option.value && 'border-primary hover:border-primary'
					)}
					onClick={() => handleOnChange(option.value as PollPrivacy)}
				>
					<FormLabel
						htmlFor={option.value}
						className="flex-1 flex space-x-3 cursor-pointer"
					>
						{React.cloneElement(option.icon, {
							className: cn(option.icon.props.className, 'mt-2'),
						})}
						<div className="flex-1">
							<h3 className="text-xl font-semibold text-zinc-700">
								{option.title}
							</h3>
							<p className="text-zinc-600 max-w-80 font-normal">
								{option.description}
							</p>
						</div>
						<div className="flex items-center">
							<div
								className={cn(
									'w-3 bg-white ring-offset-2 ring-2 ring-zinc-400 h-3 rounded-full group-hover:ring-primary',
									privacy === option.value && 'bg-primary ring-primary'
								)}
							></div>
						</div>
					</FormLabel>
				</FormItem>
			))}
		</FormItem>
	);
}

function PollStep({ form }: { form: UseFormReturn<PollMetadata> }) {
	return (
		<>
			<FormField
				control={form.control}
				name="title"
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel>Poll Title</FormLabel>
						<FormControl>
							<Input
								placeholder="Enter poll title"
								required
								{...field}
								invalid={fieldState.invalid}
								disabled={field.disabled || form.formState.isSubmitting}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="description"
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Enter poll description"
								invalid={fieldState.invalid}
								{...field}
								value={field.value || ''}
								disabled={field.disabled || form.formState.isSubmitting}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="options"
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel>Options</FormLabel>
						<FormControl>
							<OptionsInputsGroup
								value={field.value}
								onChange={field.onChange}
								showError={fieldState.invalid}
								max={MAX_POLL_OPTIONS}
								disabled={field.disabled || form.formState.isSubmitting}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}

function OptionsInputsGroup({
	value = [],
	onChange,
	max = Infinity,
	showError = false,
	disabled = false,
}: {
	value: string[];
	onChange: (value: string[]) => void;
	max?: number;
	showError?: boolean;
	disabled?: boolean;
}) {
	// Fill the array with 2 empty values
	const options = [value[0] ?? '', value[1] ?? '', ...value.slice(2)];

	const addOption = () => {
		onChange([...options, '']);
	};

	const removeOption = (index: number) => {
		const newOptions = [...options];
		newOptions.splice(index, 1);
		onChange(newOptions);
	};

	const handleOptionChange = (index: number, value: string) => {
		const newOptions = [...options];
		newOptions[index] = value;
		onChange(newOptions);
	};

	return (
		<div>
			{options.map((option, index) => (
				<div className="mb-2" key={index}>
					<div className="flex items-center">
						<Input
							value={option}
							onChange={e => handleOptionChange(index, e.target.value)}
							placeholder={`Option ${index + 1}`}
							required
							className="mr-2"
							invalid={
								(showError && option.length === 0) ||
								(option !== '' && options.slice(0, index).includes(option)) // duplicated
							}
							disabled={disabled}
						/>
						{options.length > 2 && (
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => removeOption(index)}
								className="flex-shrink-0"
								disabled={disabled}
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						)}
					</div>
					{showError && option.length === 0 && (
						<p className="text-red-500">Option cannot be empty.</p>
					)}
					{showError && option.length > 128 && (
						<p className="text-red-500">
							Option cannot be longer than 128 characters.
						</p>
					)}
				</div>
			))}

			{options.length < max ? (
				<Button
					type="button"
					variant="outline"
					onClick={addOption}
					className="mt-2"
					disabled={disabled}
				>
					<PlusIcon className="mr-2 h-4 w-4" /> Add Option
				</Button>
			) : (
				<p className="mr-2 mt-2 text-sm text-red-500">
					Maximum {max} options reached.
				</p>
			)}
		</div>
	);
}

function VotersWalletsStep({
	form,
	max = Infinity,
}: {
	form: UseFormReturn<PollMetadata>;
	max?: number;
}) {
	// Fill the array with 1 empty value
	const wallets = [
		form.watch('votersWallets')[0] ?? '',
		...form.watch('votersWallets').slice(1),
	];

	const addWallet = () => {
		form.setValue('votersWallets', [...wallets, '']);
	};

	const removeWallet = (index: number) => {
		const newOptions = [...wallets];
		newOptions.splice(index, 1);
		form.setValue('votersWallets', newOptions);
	};

	const handleWalletChange = (index: number, wallet: string) => {
		const newOptions = [...wallets];
		newOptions[index] = wallet;
		form.setValue('votersWallets', newOptions);
	};

	return (
		<FormField
			control={form.control}
			name="votersWallets"
			render={({ field, fieldState }) => (
				<FormItem>
					<FormLabel>Eligible voters wallets (public keys)</FormLabel>
					<FormControl>
						<div>
							{wallets.map((wallet, index) => (
								<div className="mb-2" key={index}>
									<div key={index} className="flex items-center">
										<Input
											value={wallet}
											onChange={e => handleWalletChange(index, e.target.value)}
											placeholder={`Wallet ${index + 1}`}
											required
											className="mr-2"
											invalid={
												(form.formState.isSubmitted && wallet.length === 0) ||
												(wallet.length > 0 && !isValidPublicKey(wallet))
											}
											disabled={field.disabled || form.formState.isSubmitting}
										/>
										{wallets.length > 1 && (
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => removeWallet(index)}
												className="flex-shrink-0"
												disabled={field.disabled || form.formState.isSubmitting}
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										)}
									</div>
									{form.formState.isSubmitted && wallet.length === 0 && (
										<p className="text-red-500">Wallet cannot be empty.</p>
									)}
									{wallet.length > 0 && !isValidPublicKey(wallet) && (
										<p className="text-red-500">Invalid wallet</p>
									)}
								</div>
							))}

							{wallets.length < max ? (
								<Button
									type="button"
									variant="outline"
									onClick={addWallet}
									className="mt-2"
									disabled={field.disabled || form.formState.isSubmitting}
								>
									<PlusIcon className="mr-2 h-4 w-4" /> Add Wallet
								</Button>
							) : (
								<p className="mr-2 mt-2 text-sm text-red-500">
									Maximum {max} wallets reached.
								</p>
							)}
						</div>
					</FormControl>
				</FormItem>
			)}
		/>
	);
}
