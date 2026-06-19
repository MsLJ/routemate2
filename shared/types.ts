/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * RouteMate Specific Types
 */

export type PlaceCategory = 'restaurant' | 'cafe' | 'hotplace' | 'boardgame' | 'escape' | 'popup';

export interface CategoryInfo {
  key: PlaceCategory;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'restaurant', label: '🍽️ 맛집', color: '#ef4444', icon: 'Utensils', description: '놓칠 수 없는 맛집 탐방' },
  { key: 'cafe', label: '☕ 카페', color: '#f97316', icon: 'Coffee', description: '아늑하고 힐링되는 카페' },
  { key: 'hotplace', label: '✨ 핫플', color: '#a855f7', icon: 'Sparkles', description: '인생샷을 건지는 명소' },
  { key: 'boardgame', label: '🎲 보드스페이스', color: '#3b82f6', icon: 'Gamepad2', description: '친구나 연인과 보드게임' },
  { key: 'escape', label: '🔑 방탈출', color: '#10b981', icon: 'Key', description: '스릴 넘치는 탈출 추리' },
  { key: 'popup', label: '🛍️ 팝업스토어', color: '#ec4899', icon: 'Store', description: '시즌 한정 트렌디 팝업' },
];

// Default category for all places
export const DEFAULT_CATEGORY: PlaceCategory = 'hotplace';
