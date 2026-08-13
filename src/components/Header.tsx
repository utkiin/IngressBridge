import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/30">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h9M4 12h6M4 18h9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l3 3-3 3" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
            IngressBridge
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://gateway-api.sigs.k8s.io/"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:inline dark:text-slate-400 dark:hover:text-white"
          >
            Gateway API docs
          </a>
          <a
            href="https://github.com/kubernetes-sigs/ingress2gateway"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:flex dark:text-slate-400 dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
            GitHub
          </a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
