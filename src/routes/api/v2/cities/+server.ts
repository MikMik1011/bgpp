import { json } from '@sveltejs/kit';
import { getCities } from '../busLogicManager';

export const GET = () => {
	const cities = getCities();
	
	return json(getCities());
};