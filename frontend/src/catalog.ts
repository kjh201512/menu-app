import type { Category } from './types';
export const CATEGORY_LABELS: Record<Category, string> = {
  KOREAN: '한식', CHINESE: '중식', JAPANESE: '일식', WESTERN: '양식', SNACK: '분식', CHICKEN: '치킨', PIZZA: '피자', ASIAN: '아시안', SALAD: '샐러드',
};
export const CATEGORY_ORDER: Category[] = ['KOREAN', 'CHINESE', 'JAPANESE', 'WESTERN', 'SNACK', 'CHICKEN', 'PIZZA', 'ASIAN', 'SALAD'];
export const CATEGORY_EMOJI: Record<Category, string> = {
  KOREAN: '🍚', CHINESE: '🥟', JAPANESE: '🍣', WESTERN: '🍝', SNACK: '🍢', CHICKEN: '🍗', PIZZA: '🍕', ASIAN: '🍜', SALAD: '🥗',
};
export const PRESET_INGREDIENTS = ['달걀', '우유', '밀', '대두', '땅콩', '호두', '새우', '게', '오징어', '조개', '돼지고기', '소고기', '닭고기', '토마토'];
