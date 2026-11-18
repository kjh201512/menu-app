import type { Restriction, RestrictionType } from './types';
export function normalizeIngredient(raw: string): string;
export function addRestriction(items: Restriction[], raw: string, type: RestrictionType): Restriction[];
export function validCoordinates(lat: string, lng: string): boolean;
