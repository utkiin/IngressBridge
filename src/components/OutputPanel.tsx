import { useState } from 'react'
import { highlightYamlLine } from '../lib/highlightYaml'
import { controllerLabels, type ControllerId } from '../lib/controllers'

interface OutputPanelProps {
  yaml: string
  error: string | null
  isEmpty: boolean
  gatewayCount: number
  routeCount: number
  detectedControllers: ControllerId[]
}

export function OutputPanel({ yaml, error, isEmpty, gatewayCount, routeCount, detectedControllers }: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard API unavailable — silently ignore, copy button just won't confirm
    }
  }

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gateway-api.yaml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const lines = yaml.split('\n')

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-gradient-to-br from-sky-500 to-indigo-600 text-[10px] font-bold text-white">
            GW
          </span>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gateway API</h2>
          {!isEmpty && !error && (
            <span className="ml-1 hidden items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:flex dark:text-slate-500">
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                {gatewayCount} Gateway{gatewayCount === 1 ? '' : 's'}
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                {routeCount} HTTPRoute{routeCount === 1 ? '' : 's'}
              </span>
              {detectedControllers
                .filter((c) => c !== 'generic')
                .map((c) => (
                  <span key={c} className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400">
                    {controllerLabels[c]}
                  </span>
                ))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isEmpty || !!error}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-3.5 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-3.5">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isEmpty || !!error}
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            </svg>
            Download
          </button>
        </div>
      </div>

      <div className="code-scroll relative h-[420px] overflow-auto">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="size-8 text-slate-300 dark:text-slate-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 0 0-2 2v4m18 0V5a2 2 0 0 0-2-2h-4m0 18h4a2 2 0 0 0 2-2v-4M3 15v4a2 2 0 0 0 2 2h4" />
            </svg>
            <p className="max-w-[26ch] text-sm text-slate-400 dark:text-slate-600">
              Paste an Ingress manifest on the left to see it converted here — instantly.
            </p>
          </div>
        )}
        {!isEmpty && error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="size-8 text-rose-400">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 8v5m0 3h.01" />
            </svg>
            <p className="max-w-[36ch] text-sm text-rose-500 dark:text-rose-400">{error}</p>
          </div>
        )}
        {!isEmpty && !error && (
          <pre className="p-4 font-mono text-[13px] leading-relaxed">
            <code>
              {lines.map((line, i) => (
                <div key={i}>{highlightYamlLine(line, i)}</div>
              ))}
            </code>
          </pre>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-1.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-600">
        <span>gateway.networking.k8s.io/v1</span>
        <span>{isEmpty || error ? '—' : `${lines.length} lines`}</span>
      </div>
    </div>
  )
}
