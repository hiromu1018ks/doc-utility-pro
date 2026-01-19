"use client"

/**
 * テーマ管理フック
 *
 * テーマの状態管理と切り替え機能を提供
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme, AppliedTheme } from '@/types'
import {
  getStoredTheme,
  resolveTheme,
  setTheme,
  initializeTheme,
  getSystemTheme,
  THEME_STORAGE_KEY,
  DARK_MEDIA_QUERY,
} from '@/lib/theme'

// ============================================================================
// 型定義
// ============================================================================

/** テーマ状態 */
interface ThemeState {
  /** テーマ設定 */
  theme: Theme
  /** 実際に適用されているテーマ */
  appliedTheme: AppliedTheme
  /** 初期化完了フラグ */
  isInitialized: boolean
}

/** テーマアクション */
interface ThemeActions {
  /** テーマを設定 */
  setTheme: (theme: Theme) => void
}

/** テーマフックの戻り値 */
export type UseThemeReturn = [ThemeState, ThemeActions]

// ============================================================================
// フック実装
// ============================================================================

/**
 * テーマ管理フック
 *
 * @returns [state, actions] タプル
 *
 * @example
 * ```tsx
 * const [{ theme, appliedTheme }, { setTheme }] = useTheme()
 * ```
 */
export function useTheme(): UseThemeReturn {
  // 初期化時のテーマを取得
  const [state, setState] = useState<ThemeState>(() => {
    const theme = typeof window !== 'undefined'
      ? getStoredTheme()
      : 'system'

    return {
      theme,
      appliedTheme: resolveTheme(theme),
      isInitialized: false,
    }
  })

  // システムテーマ変更のリスナー設定
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)

    const handleChange = () => {
      setState(prev => {
        // systemテーマの場合のみシステム設定変更を反映
        if (prev.theme === 'system') {
          return {
            ...prev,
            appliedTheme: resolveTheme(prev.theme),
          }
        }
        return prev
      })
    }

    // 現代のブラウザでは addEventListener を使用
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // クライアントサイドでの初期化
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const theme = initializeTheme()
    setState(prev => ({
      ...prev,
      theme,
      appliedTheme: resolveTheme(theme),
      isInitialized: true,
    }))
  }, [])

  // クロスタブ同期（他のタブでのテーマ変更を反映）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme
        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
          setState(prev => ({
            ...prev,
            theme: newTheme,
            appliedTheme: resolveTheme(newTheme),
          }))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // テーマ設定アクション
  const actions: ThemeActions = {
    setTheme: useCallback((theme: Theme) => {
      setTheme(theme)
      setState(prev => ({
        ...prev,
        theme,
        appliedTheme: resolveTheme(theme),
      }))
    }, []),
  }

  return [state, actions]
}
