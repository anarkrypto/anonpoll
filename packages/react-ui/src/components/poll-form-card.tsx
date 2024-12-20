'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, PlusIcon, TrashIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { pollInsertSchema } from '@zeropoll/core/schemas';
import { MAX_POLL_OPTIONS, MAX_POLL_VOTERS } from '@zeropoll/core/constants';
import { useCreatePoll, UseCreatePollOptions } from '@zeropoll/react';
import { cn } from '@/lib/cn';
import { CreatePollData } from '@zeropoll/core/controllers';
import { generateSalt, isValidPublicKey } from '@zeropoll/core/utils';

export type PollFormCardProps = {
	className?: string | undefined;
} & UseCreatePollOptions;

export function PollFormCard({
	className,
	onSuccess,
	onError,
}: PollFormCardProps) {
	const [step, setStep] = useState(1);

	const form = useForm<CreatePollData>({
		defaultValues: {
			title: '',
			description: '',
			options: [],
			votersWallets: [],
		},
		resolver:
			step === 1
				? zodResolver(pollInsertSchema.omit({ votersWallets: true }))
				: zodResolver(pollInsertSchema),
	});

	const { createPoll, isPending: creatingPoll } = useCreatePoll({
		onSuccess,
		onError,
	});

	const handleSubmit = useCallback(
		async (data: CreatePollData) => {
			if (step === 1) {
				// Prevent duplicated options and add error to the input that is duplicated
				const options = new Set<string>();
				let hasError = false;
				data.options.forEach(option => {
					if (options.has(option)) {
						hasError = true;
						form.setError('options', {
							type: 'duplicate',
							message: 'Error: Remove duplicated options',
							types: {},
						});
					}
					options.add(option);
				});

				if (hasError) {
					return;
				}

				setStep(2);
				return;
			}
			await createPoll({ ...data, salt: generateSalt() });
		},
		[step, createPoll, form]
	);

	const handleError = (error: unknown) => {
		// It should never happen, it means that something is wrong with the form.
		console.error({ error });
	};

	return (
		<Card
			className={cn(
				'mx-auto max-w-2xl rounded-lg bg-white shadow-md lg:p-6',
				className
			)}
		>
			<CardHeader>
				<CardTitle className="text-center text-3xl text-secondary">
					{step === 1 ? 'Create a New Poll' : 'Add Voters Wallets'}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit, handleError)}
						className="space-y-4"
					>
						{step === 1 ? (
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
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						) : (
							<FormField
								control={form.control}
								name="votersWallets"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>Elegible voters wallets (public keys)</FormLabel>
										<FormControl>
											<VotersWalletsInputsGroup
												value={field.value}
												onChange={field.onChange}
												showError={fieldState.invalid}
												max={MAX_POLL_VOTERS}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						)}

						<Button
							type="submit"
							className="w-full"
							color="secondary"
							loading={creatingPoll || form.formState.isSubmitting}
						>
							{step === 1 ? 'Next' : 'Create Poll'}
							{step === 1 && <ArrowRight className="ml-2 h-4 w-4" />}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function OptionsInputsGroup({
	value = [],
	onChange,
	max = Infinity,
	showError = false,
}: {
	value: string[];
	onChange: (value: string[]) => void;
	max?: number;
	showError?: boolean;
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
						/>
						{options.length > 2 && (
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => removeOption(index)}
								className="flex-shrink-0"
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

function VotersWalletsInputsGroup({
	value = [],
	onChange,
	max = Infinity,
	showError = false,
}: {
	value: string[];
	onChange: (value: string[]) => void;
	max?: number;
	showError?: boolean;
}) {
	// Fill the array with 1 empty value
	const wallets = [value[0] ?? '', ...value.slice(1)];

	const addWallet = () => {
		onChange([...wallets, '']);
	};

	const removeWallet = (index: number) => {
		const newOptions = [...wallets];
		newOptions.splice(index, 1);
		onChange(newOptions);
	};

	const handleWalletChange = (index: number, wallet: string) => {
		const newOptions = [...wallets];
		newOptions[index] = wallet;
		onChange(newOptions);
	};

	return (
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
								(showError && wallet.length === 0) ||
								(wallet.length > 0 && !isValidPublicKey(wallet))
							}
						/>
						{wallets.length > 1 && (
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => removeWallet(index)}
								className="flex-shrink-0"
							>
								<TrashIcon className="h-4 w-4" />
							</Button>
						)}
					</div>
					{showError && wallet.length === 0 && (
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
				>
					<PlusIcon className="mr-2 h-4 w-4" /> Add Wallet
				</Button>
			) : (
				<p className="mr-2 mt-2 text-sm text-red-500">
					Maximum {max} wallets reached.
				</p>
			)}
		</div>
	);
}
