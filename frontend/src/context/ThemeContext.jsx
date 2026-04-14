import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME, applyTheme, clearStoredTheme, loadStoredTheme, resolveTheme, saveTheme } from '../theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => loadStoredTheme())

  useEffect(() => {
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    saveTheme(resolved)
  }, [theme])

  const updateThemeColor = (key, value) => {
    setTheme((current) => resolveTheme({ ...current, [key]: value }))
  }

  const resetTheme = () => {
    clearStoredTheme()
    setTheme(DEFAULT_THEME)
  }

  return (
    <ThemeContext.Provider value={{ theme, updateThemeColor, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
