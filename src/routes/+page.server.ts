import type { PageServerLoad } from './$types';
import { getCities } from './api/busLogicManager';

export const load: PageServerLoad = () => {
	return { cities: getCities() };
};