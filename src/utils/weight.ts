export type WeightUnit = 'kg' | 'lb';
export const KG_PER_LB = 0.45359237;
export const toKilograms = (value: number, unit: WeightUnit) => unit === 'lb' ? value * KG_PER_LB : value;
export const fromKilograms = (value: number, unit: WeightUnit) => unit === 'lb' ? value / KG_PER_LB : value;
