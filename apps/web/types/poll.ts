import { pollInsertSchema } from '@/core/schemas/poll'
import { z } from 'zod'

export type PollData = z.infer<typeof pollInsertSchema>
