import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle light/dark mode">
      <span className="toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
