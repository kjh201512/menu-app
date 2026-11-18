export type FieldErrors = Partial<Record<'email' | 'password' | 'confirmation', string>>;
export function normalizeEmail(email: string): string;
export function validEmail(email: string): boolean;
export function utf8Bytes(value: string): number;
export function validate(email: string, password: string, confirmation?: string): FieldErrors;
