import { z } from 'zod';

const hexPattern = /^[0-9a-fA-F]+$/;

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
});

export type EncryptedMetadataV1 = z.infer<typeof encryptedMetadataSchemaV1>;
