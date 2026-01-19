/**
 * テーマユーティリティ
 *
 * テーマ設定の保存・取得、システム設定の検出を担当する純粋関数群
 */

import type { Theme, AppliedTheme } from '@/types'

// ============================================================================
// 定数
// ============================================================================

/** テーマ設定用のストレージキー */
export const THEME_STORAGE_KEY = 'doc-utility-v1-theme'

/** メディアクエリ: ダークモード検出 */
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

// ============================================================================
// テーマ適用
// ============================================================================

/**
 * HTML要素にテーマクラスを適用
 *
 * @param theme - 適用するテーマ（'light' または 'dark'）
 */
export function applyThemeToDom(theme: AppliedTheme): void {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * テーマをDOMとlocalStorageに保存
 *
 * @param theme - 保存するテーマ設定
 */
export function setTheme(theme: Theme): void {
  // localStorageに保存
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }

  // DOMに適用
  const appliedTheme = resolveTheme(theme)
  applyThemeToDom(appliedTheme)
}

// ============================================================================
// テーマ解決
// ============================================================================

/**
 * テーマ設定を実際のテーマに解決
 *
 * @param theme - テーマ設定（'light', 'dark', 'system'）
 * @returns 実際に適用するテーマ（'light' または 'dark'）
 */
export function resolveTheme(theme: Theme): AppliedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

/**
 * システムのテーマ設定を取得
 *
 * @returns システムテーマ（'light' または 'dark'）
 */
export function getSystemTheme(): AppliedTheme {
  if (typeof window === 'undefined') {
    return 'light' // SSR時のデフォルト
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}

// ============================================================================
// テーマ取得
// ============================================================================

/**
 * localStorageからテーマ設定を取得
 *
 * @returns テーマ設定（保存されていない場合は 'system'）
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch (error) {
    console.error('Failed to load theme:', error)
  }

  return 'system'
}

/**
 * 現在のテーマ設定を取得し、DOMに適用
 *
 * @returns 現在のテーマ設定
 */
export function initializeTheme(): Theme {
  const theme = getStoredTheme()
  const appliedTheme = resolveTheme(theme)
  applyThemeToDom(appliedTheme)
  return theme
}
