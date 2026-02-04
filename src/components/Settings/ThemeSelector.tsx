import { Palette, Moon, Sparkles } from 'lucide-react';
import { useThemeStore, THEME_INFO, type Theme } from '../../stores/themeStore';

const THEME_PREVIEWS: Record<Theme, {
  icon: typeof Moon;
  gradient: string;
  preview: string;
}> = {
  startup: {
    icon: Moon,
    gradient: 'linear-gradient(135deg, #a855f7 0%, #22d3ee 100%)',
    preview: '#000000',
  },
  glass: {
    icon: Sparkles,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    preview: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e)',
  },
};

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div
      className="p-6"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-primary)',
        backdropFilter: 'var(--backdrop-blur)',
        WebkitBackdropFilter: 'var(--backdrop-blur)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 flex items-center justify-center"
          style={{
            background: 'var(--accent-bg)',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <Palette style={{ color: 'var(--accent-primary)' }} size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Theme
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choose your visual style
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(THEME_INFO) as Theme[]).map((themeKey) => {
          const info = THEME_INFO[themeKey];
          const preview = THEME_PREVIEWS[themeKey];
          const isSelected = theme === themeKey;
          const Icon = preview.icon;

          return (
            <button
              key={themeKey}
              onClick={() => setTheme(themeKey)}
              className="text-left transition-all group"
              style={{
                padding: '16px',
                borderRadius: 'var(--border-radius-lg)',
                border: isSelected
                  ? '2px solid var(--accent-primary)'
                  : '2px solid var(--border-primary)',
                background: isSelected ? 'var(--accent-bg)' : 'var(--bg-secondary)',
              }}
            >
              {/* Theme Preview */}
              <div
                className="w-full h-24 mb-3 flex items-center justify-center overflow-hidden relative"
                style={{
                  background: preview.preview,
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-secondary)',
                }}
              >
                {/* Floating orbs for glass preview */}
                {themeKey === 'glass' && (
                  <>
                    <div
                      className="absolute w-16 h-16 rounded-full opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        filter: 'blur(15px)',
                        top: '-10px',
                        right: '-10px',
                      }}
                    />
                    <div
                      className="absolute w-12 h-12 rounded-full opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        filter: 'blur(12px)',
                        bottom: '-8px',
                        left: '-8px',
                      }}
                    />
                  </>
                )}

                {/* Gradient glow for startup preview */}
                {themeKey === 'startup' && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168, 85, 247, 0.4), transparent)',
                    }}
                  />
                )}

                {/* Mock UI elements */}
                <div
                  className="relative z-10 p-3 w-full max-w-[80%]"
                  style={{
                    background: themeKey === 'glass'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(17, 17, 17, 0.9)',
                    borderRadius: themeKey === 'glass' ? '12px' : '8px',
                    border: themeKey === 'glass'
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: themeKey === 'glass' ? 'blur(10px)' : 'none',
                  }}
                >
                  <div
                    className="h-2 mb-2 rounded"
                    style={{
                      width: '60%',
                      background: preview.gradient,
                    }}
                  />
                  <div
                    className="h-1.5 rounded opacity-40"
                    style={{
                      width: '80%',
                      background: '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Theme Info */}
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  size={16}
                  style={{
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                />
                <p
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {info.name}
                </p>
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {info.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
