const THEME_STORAGE_KEY = 'plumar-theme'

export const DEFAULT_THEME = {
  bgApp: '#f6f1e8',
  bgDeep: '#efe4d6',
  bgPanel: '#fffaf3',
  accent: '#c56b3f',
  accentStrong: '#a95530',
  support: '#5a927f',
}

const LEGACY_DEFAULT_THEME = {
  bgApp: '#08110b',
  bgDeep: '#0c1810',
  bgPanel: '#122317',
  accent: '#c95025',
  accentStrong: '#a0401d',
  support: '#2c876f',
}

function isHexColor(value) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '')
}

function normalizeHex(value) {
  if (!isHexColor(value)) return null
  if (value.length === 4) {
    return `#${value.slice(1).split('').map((char) => char + char).join('')}`.toLowerCase()
  }
  return value.toLowerCase()
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex)
  if (!normalized) return { r: 0, g: 0, b: 0 }

  const parsed = normalized.slice(1)
  return {
    r: Number.parseInt(parsed.slice(0, 2), 16),
    g: Number.parseInt(parsed.slice(2, 4), 16),
    b: Number.parseInt(parsed.slice(4, 6), 16),
  }
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const normalize = (channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  const red = normalize(r)
  const green = normalize(g)
  const blue = normalize(b)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixHex(baseHex, targetHex, ratio) {
  const base = hexToRgb(baseHex)
  const target = hexToRgb(targetHex)

  const channel = (start, end) => Math.round(start + (end - start) * ratio)
  const toHex = (value) => value.toString(16).padStart(2, '0')

  return `#${toHex(channel(base.r, target.r))}${toHex(channel(base.g, target.g))}${toHex(channel(base.b, target.b))}`
}

export function resolveTheme(partialTheme = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_THEME).map(([key, fallback]) => [key, normalizeHex(partialTheme[key]) || fallback]),
  )
}

export function loadStoredTheme() {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return DEFAULT_THEME
    const parsed = resolveTheme(JSON.parse(raw))
    const isLegacyDefault = Object.entries(LEGACY_DEFAULT_THEME).every(([key, value]) => parsed[key] === value)
    return isLegacyDefault ? DEFAULT_THEME : parsed
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(resolveTheme(theme)))
}

export function clearStoredTheme() {
  window.localStorage.removeItem(THEME_STORAGE_KEY)
}

export function getThemeCssVariables(theme) {
  const resolved = resolveTheme(theme)
  const isLightTheme = getRelativeLuminance(resolved.bgPanel) > 0.7
  const accentLight = mixHex(resolved.accent, isLightTheme ? '#fff1de' : '#f4dfc9', 0.38)
  const supportLight = mixHex(resolved.support, isLightTheme ? '#e2f4ed' : '#d7f0e4', 0.32)
  const panelHighlight = mixHex(resolved.bgPanel, isLightTheme ? '#ffffff' : '#ffffff', isLightTheme ? 0.32 : 0.06)
  const accentRgb = hexToRgb(resolved.accent)
  const supportRgb = hexToRgb(resolved.support)

  return {
    '--bg-app': resolved.bgApp,
    '--bg-deep': resolved.bgDeep,
    '--bg-surface': rgba(resolved.bgPanel, isLightTheme ? 0.94 : 0.88),
    '--bg-panel': rgba(resolved.bgPanel, isLightTheme ? 0.9 : 0.86),
    '--bg-panel-solid': resolved.bgPanel,
    '--bg-card': rgba(panelHighlight, isLightTheme ? 0.82 : 0.78),
    '--accent': resolved.accent,
    '--accent-strong': resolved.accentStrong,
    '--accent-light': accentLight,
    '--accent-rgb': `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
    '--accent-soft': rgba(resolved.accent, isLightTheme ? 0.12 : 0.14),
    '--accent-soft-strong': rgba(resolved.accent, isLightTheme ? 0.2 : 0.24),
    '--accent-ghost': rgba(resolved.accent, isLightTheme ? 0.06 : 0.08),
    '--accent-glow': rgba(resolved.accent, isLightTheme ? 0.24 : 0.32),
    '--accent-glow-soft': rgba(resolved.accent, isLightTheme ? 0.12 : 0.18),
    '--accent-border': rgba(resolved.accent, isLightTheme ? 0.18 : 0.22),
    '--accent-contrast': isLightTheme ? '#6a331d' : '#fff7f2',
    '--accent-ink': isLightTheme ? '#fffaf3' : resolved.bgApp,
    '--accent-copy': mixHex(resolved.accent, isLightTheme ? '#8e573c' : '#fff2e8', 0.56),
    '--support': resolved.support,
    '--support-light': supportLight,
    '--support-rgb': `${supportRgb.r}, ${supportRgb.g}, ${supportRgb.b}`,
    '--support-soft': rgba(resolved.support, isLightTheme ? 0.12 : 0.18),
    '--line-strong': rgba(resolved.accent, isLightTheme ? 0.18 : 0.22),
    '--line-soft': isLightTheme ? 'rgba(108, 88, 70, 0.1)' : 'rgba(236, 232, 223, 0.08)',
    '--text-main': isLightTheme ? '#2f261f' : '#f2ede4',
    '--text-soft': isLightTheme ? '#53463b' : '#d7e4d5',
    '--text-muted': isLightTheme ? '#7b6b5d' : '#8ca18f',
    '--text-faint': isLightTheme ? '#a08d7d' : '#5f7563',
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  const variables = getThemeCssVariables(theme)

  Object.entries(variables).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}
