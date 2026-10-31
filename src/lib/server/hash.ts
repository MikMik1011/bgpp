import crypto from 'crypto';

export const djb2Hash = (str: string): string => {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i);
	}
	return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
};

export const md5Hash = (str: string): string => {
	return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
};

export const sha256Hash = (str: string): string => {
	return crypto.createHash('sha256').update(str).digest('hex').toUpperCase();
};


export const defaultHash = md5Hash;