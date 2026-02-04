import React, { useCallback } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { Category } from "../serve/categories/types";
import { serv } from "../serve/serv";

// =============================================================================
// CATEGORY COLORS - Unique color for each category
// =============================================================================

export interface CategoryColor {
  bg: string;
  text: string;
}

// Predefined color palette for categories
const CATEGORY_COLORS: CategoryColor[] = [
  { bg: '#E6FFFA', text: '#319795' }, // Teal
  { bg: '#EBF8FF', text: '#3182CE' }, // Blue
  { bg: '#FAF5FF', text: '#805AD5' }, // Purple
  { bg: '#FFF5F5', text: '#E53E3E' }, // Red
  { bg: '#FFFAF0', text: '#DD6B20' }, // Orange
  { bg: '#F0FFF4', text: '#38A169' }, // Green
  { bg: '#FFF5F7', text: '#D53F8C' }, // Pink
  { bg: '#FFFFF0', text: '#D69E2E' }, // Yellow
  { bg: '#E6FFFF', text: '#00B5D8' }, // Cyan
  { bg: '#FFF0F5', text: '#B83280' }, // Magenta
  { bg: '#F0F5FF', text: '#5A67D8' }, // Indigo
  { bg: '#F7FFF7', text: '#2F855A' }, // Dark Green
];

/** Get a consistent color for a category based on its ID */
export const getCategoryColor = (categoryId: string): CategoryColor => {
  // Use a simple hash of the category ID to get a consistent color index
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = Math.imul(31, hash) + categoryId.charCodeAt(i);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

/** Get color by category name (fallback if no ID) */
export const getCategoryColorByName = (name: string): CategoryColor => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(31, hash) + name.charCodeAt(i);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

// =============================================================================
// BASE ATOMS - stores all categories and loading state
// =============================================================================

const categoriesAtom = atom<Category[]>([]);
const categoriesLoadingAtom = atom<boolean>(false);
const categoriesErrorAtom = atom<string | null>(null);

// =============================================================================
// DERIVED ATOMS - different views of the same data
// =============================================================================

// Active categories only
export const activeCategoriesAtom = atom((get) => {
  const categories = get(categoriesAtom);
  return categories.filter((c) => c.is_active);
});

// Categories sorted by display order
export const sortedCategoriesAtom = atom((get) => {
  const categories = get(activeCategoriesAtom);
  return [...categories].sort((a, b) => a.display_order - b.display_order);
});

// Top-level categories (no parent)
export const rootCategoriesAtom = atom((get) => {
  const categories = get(sortedCategoriesAtom);
  return categories.filter((c) => !c.parent_id);
});

// Map of category_id to category for quick lookups
export const categoryMapAtom = atom((get) => {
  const categories = get(categoriesAtom);
  return new Map(categories.map((c) => [c.category_id, c]));
});

// Child categories grouped by parent_id
export const childCategoriesAtom = atom((get) => {
  const categories = get(sortedCategoriesAtom);
  const childMap = new Map<string, Category[]>();
  
  for (const cat of categories) {
    if (cat.parent_id) {
      const existing = childMap.get(cat.parent_id) || [];
      existing.push(cat);
      childMap.set(cat.parent_id, existing);
    }
  }
  
  return childMap;
});

// =============================================================================
// HOOKS
// =============================================================================

// Main hook to fetch and manage categories
export const useCategories = () => {
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [loading, setLoading] = useAtom(categoriesLoadingAtom);
  const [error, setError] = useAtom(categoriesErrorAtom);

  const fetchCategories = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await serv('categories.list', { active_only: true });
      setCategories(response.categories || response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [loading, setCategories, setLoading, setError]);

  // Auto-fetch on first use
  React.useEffect(() => {
    if (categories.length === 0 && !loading && !error) {
      fetchCategories();
    }
  }, [categories.length, loading, error, fetchCategories]);

  return { categories, loading, error, fetchCategories, setCategories };
};

// Hook for active categories (sorted by display order)
export const useActiveCategories = () => {
  const { loading, error, fetchCategories } = useCategories();
  const active = useAtomValue(sortedCategoriesAtom);
  return { categories: active, loading, error, refresh: fetchCategories };
};

// Hook for root categories (no parent)
export const useRootCategories = () => {
  const { loading, error, fetchCategories } = useCategories();
  const roots = useAtomValue(rootCategoriesAtom);
  return { categories: roots, loading, error, refresh: fetchCategories };
};

// Hook to get category by ID
export const useCategoryById = (categoryId: string | undefined) => {
  const categoryMap = useAtomValue(categoryMapAtom);
  return categoryId ? categoryMap.get(categoryId) : undefined;
};

// Hook to get children of a category
export const useChildCategories = (parentId: string | undefined) => {
  const childMap = useAtomValue(childCategoriesAtom);
  return parentId ? childMap.get(parentId) || [] : [];
};
