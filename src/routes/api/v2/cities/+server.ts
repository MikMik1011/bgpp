import { json } from '@sveltejs/kit';
import { getCities } from '../busLogicManager';

export const GET = () => {
	return json(getCities());
};