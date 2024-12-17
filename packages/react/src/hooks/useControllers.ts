'use client';

import { Controllers } from '@zeropoll/core';
import { useEngine } from '../engine-context';

export const useControllers = (): Controllers => {
	const { engine } = useEngine();
	return engine.context;
};
