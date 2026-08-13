import './env.js';

export const CATEGORIES = ['인간관계', '진로', '커리어', '경제적 사정', '기타'];

export const MIN_CONTENT_LENGTH = 10;
export const MAX_CONTENT_LENGTH = 500;

export const PORT = Number(process.env.PORT) || 4000;

export function isValidCategory(value) {
  return CATEGORIES.includes(value);
}
