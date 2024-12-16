import crypto from 'crypto'
import {
	encryptedMetadataSchemaV1,
	EncryptedMetadataV1,
} from '@/core/schemas/poll'

export class MetadataEncryptionV1 {
	private readonly VERSION = 1
	private readonly ALGORITHM = 'aes-256-ctr'
	private readonly MAX_SIZE_BYTES = 1024 * 4 // 4KB fixed size
	private readonly key: Buffer

	constructor(privateKey: string) {
		if (!MetadataEncryptionV1.isValidKey(privateKey)) {
			throw new Error(
				'Private key must be a 32-byte hex string (64 characters)'
			)
		}

		this.key = Buffer.from(privateKey, 'hex')
	}

	private padBuffer(buffer: Buffer): Buffer {
		if (buffer.length > this.MAX_SIZE_BYTES) {
			throw new Error(
				`Data exceeds maximum size of ${this.MAX_SIZE_BYTES} bytes`
			)
		}

		// Create a buffer of fixed size
		const paddedBuffer = Buffer.alloc(this.MAX_SIZE_BYTES)

		// Write original length at the start (4 bytes)
		paddedBuffer.writeUInt32BE(buffer.length, 0)

		// Copy original data after the length
		buffer.copy(paddedBuffer, 4)

		// Rest of the buffer remains as zeros
		return paddedBuffer
	}

	private unpadBuffer(paddedBuffer: Buffer): Buffer {
		// Read the original length from the first 4 bytes
		const originalLength = paddedBuffer.readUInt32BE(0)

		// Extract the original data
		return paddedBuffer.subarray(4, 4 + originalLength)
	}

	async encrypt(plaintext: string): Promise<EncryptedMetadataV1> {
		const iv = crypto.randomBytes(16)

		// Convert to buffer and pad to fixed size
		const paddedBuffer = this.padBuffer(Buffer.from(plaintext, 'utf8'))

		const cipher = crypto.createCipheriv(this.ALGORITHM, this.key, iv)

		let ciphertext = cipher.update(paddedBuffer, undefined, 'hex')
		ciphertext += cipher.final('hex')

		return {
			version: this.VERSION,
			crypto: {
				ciphertext,
				cipherparams: {
					iv: iv.toString('hex'),
				},
				cipher: this.ALGORITHM,
			},
		}
	}

	async decrypt(encryptedMetadata: EncryptedMetadataV1): Promise<any> {
		encryptedMetadataSchemaV1.parse(encryptedMetadata)

		const iv = Buffer.from(encryptedMetadata.crypto.cipherparams.iv, 'hex')

		const decipher = crypto.createDecipheriv(this.ALGORITHM, this.key, iv)

		// Decrypt to padded buffer
		let paddedBuffer = Buffer.concat([
			decipher.update(encryptedMetadata.crypto.ciphertext, 'hex'),
			decipher.final(),
		])

		// Unpad to get original data
		const originalBuffer = this.unpadBuffer(paddedBuffer)

		return JSON.parse(originalBuffer.toString('utf8'))
	}

	static isValidKey(key: string): boolean {
		// Validate hex string length (32 bytes = 64 hex characters)
		return key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
	}

	static isEncryptedMetadataV1(data: any): data is EncryptedMetadataV1 {
		return encryptedMetadataSchemaV1.safeParse(data).success
	}

	static generateKey(): string {
		return crypto.randomBytes(32).toString('hex')
	}
}
