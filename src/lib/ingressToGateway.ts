import { loadAll } from 'js-yaml'
import {
  applyIngressLevelAnnotations,
  detectController,
  stripPathFilter,
  unhandledAnnotationWarning,
  type ControllerId,
} from './controllers'
import { mergeCanaries, parseCanaryAnnotations, type ParsedIngress, type ParsedRule } from './canary'

export interface ConvertOptions {
  gatewayClassName: string
  gatewayName?: string
  namespaceOverride?: string
  /** Force annotation parsing for a specific controller instead of auto-detecting per Ingress. */
  controllerOverride?: ControllerId | 'auto'
}

export interface ConvertResult {
  yaml: string
  warnings: string[]
  gatewayCount: number
  routeCount: number
  ingressCount: number
  detectedControllers: ControllerId[]
}

interface IngressBackendPort {
  number?: number
  name?: string
}

interface IngressBackend {
  service?: {
    name: string
    port?: IngressBackendPort
  }
}

interface IngressPath {
  path?: string
  pathType?: 'Exact' | 'Prefix' | 'ImplementationSpecific'
  backend: IngressBackend
}

interface IngressRule {
  host?: string
  http?: {
    paths: IngressPath[]
  }
}

interface IngressTLS {
  hosts?: string[]
  secretName?: string
}

interface IngressDoc {
  kind?: string
  apiVersion?: string
  metadata?: {
    name?: string
    namespace?: string
    annotations?: Record<string, string>
  }
  spec?: {
    ingressClassName?: string
    defaultBackend?: IngressBackend
    tls?: IngressTLS[]
    rules?: IngressRule[]
  }
}

// --- helpers -----------------------------------------------------------

function sanitizeName(input: string, fallback = 'resource'): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
  return cleaned || fallback
}

function ingressClassOf(doc: IngressDoc): string {
  return (
    doc.spec?.ingressClassName ||
    doc.metadata?.annotations?.['kubernetes.io/ingress.class'] ||
    ''
  )
}

function mapPathType(
  pathType: IngressPath['pathType'] | undefined,
  warnings: string[],
  context: string,
): 'Exact' | 'PathPrefix' {
  if (pathType === 'Exact') return 'Exact'
  if (pathType === 'ImplementationSpecific') {
    warnings.push(
      `${context}: pathType "ImplementationSpecific" has no direct Gateway API equivalent — converted to "PathPrefix", please verify matching behaviour.`,
    )
  }
  return 'PathPrefix'
}

function backendRef(
  backend: IngressBackend,
  warnings: string[],
  context: string,
): { name: string; port: number; kind: 'Service' } | null {
  const svc = backend.service
  if (!svc?.name) {
    warnings.push(`${context}: backend has no service reference, rule skipped.`)
    return null
  }
  let port = svc.port?.number
  if (port === undefined && svc.port?.name) {
    warnings.push(
      `${context}: backend port is referenced by name ("${svc.port.name}"); Gateway API HTTPRoute requires a numeric port — defaulted to 80, please correct manually.`,
    )
    port = 80
  }
  if (port === undefined) {
    warnings.push(`${context}: backend has no port, defaulted to 80.`)
    port = 80
  }
  return { name: svc.name, port, kind: 'Service' }
}

// --- core conversion -----------------------------------------------------

export function convertIngressToGateway(
  input: string,
  options: ConvertOptions,
): ConvertResult {
  const warnings: string[] = []
  let docs: unknown[]

  try {
    docs = loadAll(input).filter((d): d is IngressDoc => !!d)
  } catch (err) {
    throw new Error(
      `Failed to parse YAML: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  const ingresses = docs.filter(
    (d): d is IngressDoc => (d as IngressDoc)?.kind === 'Ingress',
  )

  if (ingresses.length === 0) {
    throw new Error('No resources with kind "Ingress" were found in the input.')
  }

  const gatewayClassName = sanitizeName(options.gatewayClassName || 'example-gateway-class')

  const gatewayKey = (doc: IngressDoc) =>
    `${options.namespaceOverride || doc.metadata?.namespace || 'default'}::${ingressClassOf(doc) || 'default'}`

  interface ListenerInfo {
    name: string
    protocol: 'HTTP' | 'HTTPS'
    port: number
    hostname?: string
    tlsSecretName?: string
  }

  const gateways = new Map<
    string,
    {
      namespace: string
      ingressClass: string
      listeners: Map<string, ListenerInfo>
      annotations: Record<string, string>
    }
  >()

  const detectedControllers = new Set<ControllerId>()
  const parsedIngresses: ParsedIngress[] = []

  for (const doc of ingresses) {
    const name = doc.metadata?.name || 'ingress'
    const namespace = options.namespaceOverride || doc.metadata?.namespace || 'default'
    const ingressClass = ingressClassOf(doc)
    const context = `Ingress "${namespace}/${name}"`
    const annotations = doc.metadata?.annotations || {}

    const controller: ControllerId =
      options.controllerOverride && options.controllerOverride !== 'auto'
        ? options.controllerOverride
        : detectController(doc)
    detectedControllers.add(controller)

    if (!ingressClass) {
      warnings.push(
        `${context}: no ingressClassName set — assumed to belong to the default Gateway/class.`,
      )
    }

    const key = gatewayKey(doc)
    if (!gateways.has(key)) {
      gateways.set(key, {
        namespace,
        ingressClass: ingressClass || 'default',
        listeners: new Map(),
        annotations: {},
      })
    }
    const gw = gateways.get(key)!

    // TLS hosts -> HTTPS listeners
    const tlsHosts = new Set<string>()
    for (const tls of doc.spec?.tls || []) {
      const hosts = tls.hosts && tls.hosts.length > 0 ? tls.hosts : [undefined]
      for (const host of hosts) {
        if (host) tlsHosts.add(host)
        const listenerName = host ? `https-${sanitizeName(host)}` : 'https'
        if (!gw.listeners.has(listenerName)) {
          if (!tls.secretName) {
            warnings.push(
              `${context}: TLS entry for host "${host ?? '*'}" has no secretName — listener generated without certificateRefs, will not function until one is added.`,
            )
          }
          gw.listeners.set(listenerName, {
            name: listenerName,
            protocol: 'HTTPS',
            port: 443,
            hostname: host,
            tlsSecretName: tls.secretName,
          })
        }
      }
    }

    if (!gw.listeners.has('http')) {
      gw.listeners.set('http', { name: 'http', protocol: 'HTTP', port: 80 })
    }

    const sslRedirectAnnotation = annotations['nginx.ingress.kubernetes.io/ssl-redirect']
    const forceSslRedirect = annotations['nginx.ingress.kubernetes.io/force-ssl-redirect'] === 'true'
    if (tlsHosts.size > 0 && controller === 'nginx' && sslRedirectAnnotation !== 'false') {
      warnings.push(
        `${context}: relies on automatic HTTP→HTTPS redirect (nginx "ssl-redirect"${forceSslRedirect ? '/"force-ssl-redirect"' : ''}). Gateway API does not redirect implicitly — add an HTTPRoute with a "RequestRedirect" filter (scheme: https) on the HTTP listener if you need this behaviour.`,
      )
    }

    const { gatewayAnnotations, warnings: controllerWarnings } = applyIngressLevelAnnotations(
      controller,
      annotations,
      context,
    )
    Object.assign(gw.annotations, gatewayAnnotations)
    warnings.push(...controllerWarnings)

    for (const annKey of Object.keys(annotations)) {
      const w = unhandledAnnotationWarning(controller, annKey, context)
      if (w) warnings.push(w)
    }

    // rewrite-target (nginx)
    const rewriteTarget = annotations['nginx.ingress.kubernetes.io/rewrite-target']
    const hasRegexRewrite = !!rewriteTarget && /\$\d/.test(rewriteTarget)
    if (controller === 'nginx' && hasRegexRewrite) {
      warnings.push(
        `${context}: rewrite-target "${rewriteTarget}" uses regex capture groups — this cannot be automatically translated to a Gateway API URLRewrite filter, please rewrite the path matching manually.`,
      )
    }
    const doStripPath = stripPathFilter(controller, annotations)

    const rules = doc.spec?.rules || []
    const hostnames = rules.map((r) => r.host).filter((h): h is string => !!h)

    const outRules: ParsedRule[] = []

    for (const rule of rules) {
      for (const p of rule.http?.paths || []) {
        const ref = backendRef(p.backend, warnings, context)
        if (!ref) continue
        const pathType = mapPathType(p.pathType, warnings, context)
        const pathValue = p.path || '/'
        const filters: unknown[] = []
        if (controller === 'nginx' && rewriteTarget && !hasRegexRewrite) {
          filters.push({
            type: 'URLRewrite',
            urlRewrite: {
              path: { type: 'ReplacePrefixMatch', replacePrefixMatch: rewriteTarget },
            },
          })
        } else if (doStripPath) {
          filters.push({
            type: 'URLRewrite',
            urlRewrite: { path: { type: 'ReplacePrefixMatch', replacePrefixMatch: '/' } },
          })
        }
        outRules.push({
          matches: [{ path: { type: pathType, value: pathValue } }],
          ...(filters.length > 0 ? { filters } : {}),
          backendRefs: [ref],
        })
      }
    }

    if (doc.spec?.defaultBackend) {
      const ref = backendRef(doc.spec.defaultBackend, warnings, `${context} (defaultBackend)`)
      if (ref) {
        outRules.push({
          matches: [{ path: { type: 'PathPrefix', value: '/' } }],
          backendRefs: [ref],
        })
        if (outRules.length > 1) {
          warnings.push(
            `${context}: defaultBackend was appended as a catch-all "PathPrefix: /" rule — Gateway API does not guarantee the same fallback ordering as Ingress, verify rule precedence.`,
          )
        }
      }
    }

    if (outRules.length === 0) {
      warnings.push(`${context}: produced no HTTPRoute rules, skipping.`)
      continue
    }

    const gatewayName = sanitizeName(
      options.gatewayName || (ingressClass ? `${ingressClass}-gateway` : 'default-gateway'),
    )

    parsedIngresses.push({
      key: `${namespace}::${[...hostnames].sort().join(',')}`,
      name,
      namespace,
      ingressClass: ingressClass || 'default',
      gatewayName,
      hostnames,
      rules: outRules,
      canary: controller === 'nginx' ? parseCanaryAnnotations(annotations) : undefined,
    })
  }

  const mergedIngresses = mergeCanaries(parsedIngresses, (msg) => warnings.push(msg))

  const routesYamlDocs: string[] = []
  let routeCount = 0
  for (const ing of mergedIngresses) {
    const routeDoc = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'HTTPRoute',
      metadata: {
        name: sanitizeName(ing.name),
        namespace: ing.namespace,
      },
      spec: {
        parentRefs: [{ name: ing.gatewayName }],
        ...(ing.hostnames.length > 0 ? { hostnames: ing.hostnames } : {}),
        rules: ing.rules,
      },
    }
    routesYamlDocs.push(toYamlDoc(routeDoc))
    routeCount++
  }

  const gatewayYamlDocs: string[] = []
  for (const [, gw] of gateways) {
    const gatewayName = sanitizeName(
      options.gatewayName || (gw.ingressClass !== 'default' ? `${gw.ingressClass}-gateway` : 'default-gateway'),
    )
    const listeners = Array.from(gw.listeners.values()).map((l) => ({
      name: l.name,
      protocol: l.protocol,
      port: l.port,
      ...(l.hostname ? { hostname: l.hostname } : {}),
      ...(l.protocol === 'HTTPS'
        ? {
            tls: {
              mode: 'Terminate',
              certificateRefs: l.tlsSecretName ? [{ name: l.tlsSecretName }] : [],
            },
          }
        : {}),
      allowedRoutes: { namespaces: { from: 'Same' } },
    }))

    const gatewayDoc = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      metadata: {
        name: gatewayName,
        namespace: gw.namespace,
        ...(Object.keys(gw.annotations).length > 0 ? { annotations: gw.annotations } : {}),
      },
      spec: {
        gatewayClassName,
        listeners,
      },
    }
    gatewayYamlDocs.push(toYamlDoc(gatewayDoc))
  }

  const controllersList = Array.from(detectedControllers)
  const header = [
    '# Generated by IngressBridge — best-effort conversion, review before applying.',
    `# Source: ${ingresses.length} Ingress resource${ingresses.length === 1 ? '' : 's'} (${controllersList.join(', ')}) -> ${gateways.size} Gateway(s), ${routeCount} HTTPRoute(s).`,
  ].join('\n')

  const yaml = [header, ...gatewayYamlDocs, ...routesYamlDocs].join('\n---\n')

  return {
    yaml,
    warnings,
    gatewayCount: gateways.size,
    routeCount,
    ingressCount: ingresses.length,
    detectedControllers: controllersList,
  }
}

// minimal, dependency-free YAML serializer tailored to the plain-object shapes we emit above
function toYamlDoc(value: unknown): string {
  return stringify(value, 0).trimEnd() + '\n'
}

function stringify(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent)
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return stringifyScalar(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const body = stringify(item, indent + 1)
          const lines = body.split('\n')
          if (lines.length === 1) return `${pad}- ${lines[0].trimStart()}`
          return `${pad}- ${lines[0].trimStart()}\n${lines.slice(1).join('\n')}`
        }
        return `${pad}- ${stringify(item, indent + 1)}`
      })
      .join('\n')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    )
    if (entries.length === 0) return '{}'
    return entries
      .map(([k, v]) => {
        if (v !== null && typeof v === 'object' && !isEmptyContainer(v)) {
          return `${pad}${k}:\n${stringify(v, indent + 1)}`
        }
        return `${pad}${k}: ${stringify(v, indent + 1)}`
      })
      .join('\n')
  }
  return String(value)
}

function isEmptyContainer(v: unknown): boolean {
  return (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && v !== null && Object.keys(v).length === 0)
}

function stringifyScalar(s: string): string {
  if (s === '') return "''"
  const needsQuoting = /^[\s]|[\s]$|[:#{}[\],&*!|>'"%@`]|^(true|false|null|~|\d)/i.test(s) || /:\s/.test(s)
  if (!needsQuoting) return s
  return `'${s.replace(/'/g, "''")}'`
}
