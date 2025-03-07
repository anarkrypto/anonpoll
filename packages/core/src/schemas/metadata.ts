import { z } from 'zod';
import { MAX_POLL_OPTIONS } from '@/constants';
import { PublicKey } from 'o1js';

export const pollMetadataSchema = z.object({
	title: z.string().min(3).trim().max(128),
	description: z.string().max(1024).nullable().optional(),
	options: z
		.array(z.string().trim().min(1).max(128))
		.min(2)
		.max(MAX_POLL_OPTIONS),
	salt: z.string().min(1).max(128).optional(),
	votersWallets: z
		.array(
			z.string().refine(
				value => {
					try {
						PublicKey.fromBase58(value);
						return true;
					} catch {
						return false;
					}
				},
				{
					message: 'Must be a valid public key',
				}
			)
		)
		.min(1)
		.optional(),
});

export type PollMetadata = z.infer<typeof pollMetadataSchema>;
