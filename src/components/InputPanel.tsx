import { examples } from '../lib/examples'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
}

export function InputPanel({ value, onChange }: InputPanelProps) {
  const lineCount = value.length === 0 ? 0 : value.split('\n').length

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            K8s
          </span>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ingress</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              const ex = examples.find((x) => x.id === e.target.value)
              if (ex) onChange(ex.yaml)
              e.target.value = ''
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
          >
            <option value="" disabled>
              Load example…
            </option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: my-app\n...'}
        spellCheck={false}
        className="code-scroll h-[420px] w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-600"
      />

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-1.5 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-600">
        <span>YAML · one or more Ingress documents</span>
        <span>{lineCount} lines</span>
      </div>
    </div>
  )
}
