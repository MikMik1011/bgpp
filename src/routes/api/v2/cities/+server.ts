import { json } from '@sveltejs/kit';
import { getCities } from '../bgppManager';

export const GET = () => {
	const cities = getCities();
	
	return json(getCities());
};