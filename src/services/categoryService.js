import { DEFAULT_CATEGORY_ID } from '../data/defaultCategories.js';
import { getAll, getById, remove, upsert } from '../db/indexedDb.js';
import { extractLearningKeyword, includesNormalized, normalizeText } from '../utils/textUtils.js';

export function getCategoryById(categories, categoryId) {
  return categories.find((category) => category.id === categoryId);
}

export function getDefaultCategory(categories) {
  return getCategoryById(categories, DEFAULT_CATEGORY_ID) || categories[0];
}

export function suggestCategory(description, categories, learnedRules = []) {
  const text = normalizeText(description);
  if (!text) return getDefaultCategory(categories);

  const learned = [...learnedRules]
    .sort((a, b) => Number(b.usageCount || 0) - Number(a.usageCount || 0))
    .find((rule) => includesNormalized(text, rule.keywordNormalized || rule.originalText));

  if (learned) {
    return getCategoryById(categories, learned.categoryId) || getDefaultCategory(categories);
  }

  const byKeyword = categories.find((category) =>
    (category.keywords || []).some((keyword) => includesNormalized(text, keyword)),
  );

  return byKeyword || getDefaultCategory(categories);
}

export async function saveCategory(category) {
  const order = Number.isFinite(Number(category.order)) ? Number(category.order) : Date.now();
  return upsert('categories', {
    ...category,
    name: category.name?.trim(),
    keywords: Array.isArray(category.keywords)
      ? category.keywords
      : String(category.keywords || '')
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean),
    order,
  });
}

export async function deleteCategoryIfUnused(categoryId) {
  if (categoryId === DEFAULT_CATEGORY_ID) {
    throw new Error('A categoria "Sem categoria" não pode ser excluída.');
  }

  const [recurringBills, monthlyBills, transactions] = await Promise.all([
    getAll('recurring_bills'),
    getAll('monthly_bills'),
    getAll('card_transactions'),
  ]);

  const inUse = [...recurringBills, ...monthlyBills, ...transactions].some((item) => item.categoryId === categoryId);
  if (inUse) {
    throw new Error('Esta categoria já está em uso e não pode ser excluída.');
  }

  await remove('categories', categoryId);
}

export async function learnCategoryFromCorrection(originalText, categoryId) {
  if (!originalText || !categoryId || categoryId === DEFAULT_CATEGORY_ID) return null;

  const keywordNormalized = extractLearningKeyword(originalText);
  if (!keywordNormalized) return null;

  const rules = await getAll('learned_category_rules');
  const existing = rules.find((rule) => rule.keywordNormalized === keywordNormalized);

  if (existing) {
    return upsert('learned_category_rules', {
      ...existing,
      categoryId,
      usageCount: Number(existing.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    });
  }

  return upsert('learned_category_rules', {
    originalText,
    keywordNormalized,
    categoryId,
    usageCount: 1,
    lastUsedAt: new Date().toISOString(),
  });
}

export async function saveLearnedRule(rule) {
  return upsert('learned_category_rules', {
    ...rule,
    keywordNormalized: extractLearningKeyword(rule.keywordNormalized || rule.originalText),
    usageCount: Number(rule.usageCount || 0),
  });
}

export async function deleteLearnedRule(id) {
  return remove('learned_category_rules', id);
}

export async function findCategoryName(categoryId) {
  const category = await getById('categories', categoryId);
  return category?.name || 'Sem categoria';
}
