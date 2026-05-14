import { getCategoryById } from '../services/categoryService.js';

export default function CategoryBadge({ categoryId, categories }) {
  const category = getCategoryById(categories, categoryId) || categories[0];
  if (!category) return null;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 text-xs font-black"
      style={{ backgroundColor: `${category.color}22`, color: category.color }}
      title={category.name}
    >
      <span aria-hidden="true">{category.icon}</span>
      <span className="truncate">{category.name}</span>
    </span>
  );
}
