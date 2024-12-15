import { z } from 'zod'
import { MAX_POLL_OPTIONS, MAX_POLL_VOTERS } from '@/core/constants'
import { PublicKey } from 'o1js'

export const pollInsertSchema = z.object({
	title: z.string().min(3).trim().max(128),
	description: z.string().max(1024).nullable().optional(),
	options: z
		.array(z.string().trim().min(1).max(128))
		.min(2)
		.max(MAX_POLL_OPTIONS),
	salt: z.string().min(1).max(128),
	votersWallets: z
		.array(
			z.string().refine(
				value => {
					try {
						PublicKey.fromBase58(value)
						return true
					} catch (error) {
						return false
					}
				},
				{
					message: 'Must be a valid public key',
				}
			)
		)
		.min(1)
		.max(MAX_POLL_VOTERS),
})

const hexPattern = /^[0-9a-fA-F]+$/

export const encryptedMetadataSchemaV1 = z.object({
	version: z.literal(1),
	crypto: z.object({
		ciphertext: z
			.string()
			.length(4 * 1024 * 2) // 4KB in hex (8192 characters)
			.regex(hexPattern, 'Must be a valid hex string'),

		cipherparams: z.object({
			iv: z
				.string()
				.length(16 * 2) // 16 bytes in hex (32 characters)
				.regex(hexPattern, 'IV must be a valid hex string'),
		}),

		cipher: z.literal('aes-256-ctr'),
	}),
})

export type EncryptedMetadataV1 = z.infer<typeof encryptedMetadataSchemaV1>
