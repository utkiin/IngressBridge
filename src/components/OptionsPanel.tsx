import { useState } from 'react'
import { controllerLabels, type ControllerId } from '../lib/controllers'

export interface Options {
  gatewayClassName: string
  gatewayName: string
  namespaceOverride: string
  controllerOverride: ControllerId | 'auto'
}

const controllerOptions: (ControllerId | 'auto')[] = ['auto', 'nginx', 'traefik', 'alb', 'kong']

interface OptionsPanelProps {
  options: Options
  onChange: (options: Options) => void
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hint: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-sky-500"
      />
      <span className="text-[11px] text-slate-400 dark:text-slate-600">{hint}</span>
    </label>
  )
}

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21h3M12 3v2m0 14v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
          Advanced options
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          className={`size-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0">
          <div className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:grid-cols-4 dark:border-slate-800">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Source controller</span>
              <select
                value={options.controllerOverride}
                onChange={(e) => onChange({ ...options, controllerOverride: e.target.value as Options['controllerOverride'] })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500"
              >
                {controllerOptions.map((id) => (
                  <option key={id} value={id}>
                    {id === 'auto' ? 'Auto-detect' : controllerLabels[id]}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                Which annotations to interpret (nginx canary, ALB, Traefik, Kong…).
              </span>
            </label>
            <Field
              label="GatewayClass name"
              placeholder="e.g. istio, envoy-gateway, cilium"
              value={options.gatewayClassName}
              onChange={(v) => onChange({ ...options, gatewayClassName: v })}
              hint="Set to your cluster's Gateway controller."
            />
            <Field
              label="Gateway name override"
              placeholder="auto: <ingress-class>-gateway"
              value={options.gatewayName}
              onChange={(v) => onChange({ ...options, gatewayName: v })}
              hint="Leave blank to derive from ingressClassName."
            />
            <Field
              label="Namespace override"
              placeholder="auto: from each Ingress"
              value={options.namespaceOverride}
              onChange={(v) => onChange({ ...options, namespaceOverride: v })}
              hint="Force all generated resources into one namespace."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
