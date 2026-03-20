export const PRESET_CATEGORIES = [
  'food',
  'transport',
  'fuel',
  'services',
  'health',
  'entertainment',
  'education',
  'clothing',
  'housing',
  'salary',
  'freelance',
  'investment',
  'other',
] as const;
 
export type PresetCategory = typeof PRESET_CATEGORIES[number];
 
// Valor especial que activa el input de texto libre en el modal
export const CUSTOM_CATEGORY_KEY = 'custom';
 
// Resuelve la clave interna al texto traducido vía i18next
// Uso: resolveCategory(tx.category, t)
export const resolveCategory = (
  categoryKey: string,
  t: (key: string) => string
): string => {
  if (!categoryKey) return '—';
  // Si es una clave predefinida la traduce, si no la muestra tal cual (es personalizada)
  if (PRESET_CATEGORIES.includes(categoryKey as PresetCategory)) {
    return t(`categories.${categoryKey}`);
  }
  return categoryKey;
};