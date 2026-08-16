import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { InputPanel } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { OptionsPanel, type Options } from './components/OptionsPanel'
import { WarningsPanel } from './components/WarningsPanel'
import { useTheme } from './hooks/useTheme'
import { convertIngressToGateway } from './lib/ingressToGateway'
import { examples } from './lib/examples'
import type { ControllerId } from './lib/controllers'

const features = [
  {
    title: '100% client-side',
    description: 'Your manifests are parsed and converted entirely in the browser — nothing is ever uploaded or logged.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V7l-8-4Z" />
    ),
  },
  {
    title: 'Honest, not magic',
    description: "Anything that can't be translated one-to-one — regex rewrites, controller-specific annotations — is flagged, never silently dropped.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />,
  },
  {
    title: 'Any Gateway controller',
    description: 'Output is standard gateway.networking.k8s.io/v1 — works with Istio, Envoy Gateway, Cilium, NGINX Gateway Fabric and more.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h9M4 12h6M4 18h9M17 9l3 3-3 3" />,
  },
]

function App() {
  const { theme, toggle } = useTheme()
  const [inputYaml, setInputYaml] = useState(examples[0].yaml)
  const [options, setOptions] = useState<Options>({
    gatewayClassName: 'example-gateway-class',
    gatewayName: '',
    namespaceOverride: '',
    controllerOverride: 'auto',
  })

  const result = useMemo(() => {
    if (!inputYaml.trim()) {
      return {
        yaml: '',
        warnings: [] as string[],
        gatewayCount: 0,
        routeCount: 0,
        detectedControllers: [] as ControllerId[],
        error: null as string | null,
        isEmpty: true,
      }
    }
    try {
      const r = convertIngressToGateway(inputYaml, {
        gatewayClassName: options.gatewayClassName,
        gatewayName: options.gatewayName || undefined,
        namespaceOverride: options.namespaceOverride || undefined,
        controllerOverride: options.controllerOverride,
      })
      return { ...r, error: null as string | null, isEmpty: false }
    } catch (err) {
      return {
        yaml: '',
        warnings: [] as string[],
        gatewayCount: 0,
        routeCount: 0,
        detectedControllers: [] as ControllerId[],
        error: err instanceof Error ? err.message : String(err),
        isEmpty: false,
      }
    }
  }, [inputYaml, options])

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header theme={theme} onToggleTheme={toggle} />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="animate-drift absolute -left-24 -top-24 size-96 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />
            <div className="animate-drift-slow absolute -right-24 top-10 size-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
          </div>

          <div className="mx-auto max-w-4xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
            <div className="animate-fade-in-up mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Gateway API v1 · free &amp; open
            </div>
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl" style={{ animationDelay: '60ms' }}>
              Turn Kubernetes{' '}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">Ingress</span>{' '}
              into{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Gateway API</span>
            </h1>
            <p className="animate-fade-in-up mx-auto mt-5 max-w-2xl text-balance text-base text-slate-500 sm:text-lg dark:text-slate-400" style={{ animationDelay: '120ms' }}>
              Paste your Ingress manifest, get production-ready Gateway, and HTTPRoute
              resources in real time. No install, no sign-up, no data leaves your browser.
            </p>
            <div className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '180ms' }}>
              <a
                href="#converter"
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/20 dark:bg-white dark:text-slate-900"
              >
                Start converting ↓
              </a>
              <a
                href="https://github.com/kubernetes-sigs/ingress2gateway"
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              >
                Official CLI project
              </a>
            </div>
          </div>
        </section>

        <section id="converter" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <InputPanel value={inputYaml} onChange={setInputYaml} />
            <OutputPanel
              yaml={result.yaml}
              error={result.error}
              isEmpty={result.isEmpty}
              gatewayCount={result.gatewayCount}
              routeCount={result.routeCount}
              detectedControllers={result.detectedControllers}
            />
          </div>

          <div className="mt-5 space-y-4">
            <OptionsPanel options={options} onChange={setOptions} />
            <WarningsPanel warnings={result.warnings} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/[0.04] dark:border-slate-800 dark:bg-slate-900/40 dark:hover:shadow-black/20"
              >
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-4.5">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="mx-auto max-w-2xl text-[13px] leading-relaxed text-slate-400 dark:text-slate-600">
            This is a best-effort, client-side converter and not affiliated with the Kubernetes
            project. Always review generated manifests before applying them to a cluster. See the{' '}
            <a
              href="https://github.com/kubernetes-sigs/ingress2gateway"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:decoration-slate-700 dark:hover:text-slate-200"
            >
              official ingress2gateway CLI
            </a>{' '}
            for the authoritative, cluster-aware migration path.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
