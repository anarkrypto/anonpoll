import { ChainController } from '@/controllers/chain-controller'
import { TestingAppChain } from '@proto-kit/sdk'

export class ChainTestController extends ChainController {
	constructor(private appChain: TestingAppChain<any, any, any, any>) {
		super({
			tickInterval: 1000,
			graphqlUrl: '',
		})
	}

	override async loadBlock() {
		try {
			const block = await this.appChain.produceBlock()

			if (!block) {
				throw new Error('Block not found')
			}

			this.update({
				block: {
					height: block.height.toString(),
					txs: block.transactions.map(tx => {
						return {
							status: tx.status.toBoolean(),
							statusMessage: tx.statusMessage,
							tx: {
								...tx.tx.toJSON(),
								argsJSON: [],
							},
						}
					}),
				},
			})
		} catch {}
	}

	override async start() {
		this.appChain.events.on('mempool-transaction-added', async () => {
			await this.loadBlock()
		})
	}
}
