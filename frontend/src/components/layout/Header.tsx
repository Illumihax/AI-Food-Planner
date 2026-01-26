import { useTranslation } from 'react-i18next'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Moon, Sun, Monitor, Languages } from 'lucide-react'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-lg font-bold">{t('app.name')}</span>
        </div>
        
        {/* Empty space for desktop */}
        <div className="hidden lg:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-5 w-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.language', 'Language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => changeLanguage('en')}
                className={i18n.language === 'en' ? 'bg-accent' : ''}
              >
                {t('language.english')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeLanguage('de')}
                className={i18n.language === 'de' ? 'bg-accent' : ''}
              >
                {t('language.german')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('theme.theme', 'Theme')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={theme === 'light' ? 'bg-accent' : ''}
              >
                <Sun className="mr-2 h-4 w-4" />
                {t('theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={theme === 'dark' ? 'bg-accent' : ''}
              >
                <Moon className="mr-2 h-4 w-4" />
                {t('theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={theme === 'system' ? 'bg-accent' : ''}
              >
                <Monitor className="mr-2 h-4 w-4" />
                {t('theme.system')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
