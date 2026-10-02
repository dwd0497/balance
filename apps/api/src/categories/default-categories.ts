import type { CategoryData } from './categories.repository';

/** Базовый набор, который получает каждый новый пользователь. */
export const DEFAULT_CATEGORIES: readonly CategoryData[] = [
  { name: 'Черновые материалы', color: '#a1887f' },
  { name: 'Чистовые материалы', color: '#4fc3f7' },
  { name: 'Работы', color: '#ffb74d' },
  { name: 'Мебель', color: '#81c784' },
  { name: 'Техника', color: '#9575cd' },
  { name: 'Прочее', color: '#90a4ae' },
];
