import { useEngine } from '../engine-context'

export const useControllers = () => {
	const { engine } = useEngine()
	return engine.context
}
