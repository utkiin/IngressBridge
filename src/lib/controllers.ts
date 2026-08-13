export type ControllerId = 'nginx' | 'traefik' | 'alb' | 'kong' | 'generic'

export const controllerLabels: Record<ControllerId, string> = {
  nginx: 'NGINX Ingress',
  traefik: 'Traefik',
  alb: 'AWS ALB',
  kong: 'Kong',
  generic: 'Generic / unknown',
}

interface DocLike {
  spec?: { ingressClassName?: string }
  metadata?: { annotations?: Record<string, string> }
}

const PREFIXES: { id: ControllerId; prefix: string }[] = [
  { id: 'nginx', prefix: 'nginx.ingress.kubernetes.io/' },
  { id: 'traefik', prefix: 'traefik.ingress.kubernetes.io/' },
  { id: 'alb', prefix: 'alb.ingress.kubernetes.io/' },
  { id: 'kong', prefix: 'konghq.com/' },
]

const CLASS_HINTS: { id: ControllerId; match: RegExp }[] = [
  { id: 'nginx', match: /nginx/i },
  { id: 'traefik', match: /traefik/i },
  { id: 'alb', match: /alb|aws/i },
  { id: 'kong', match: /kong/i },
]

export function detectController(doc: DocLike): ControllerId {
  const annotations = doc.metadata?.annotations || {}
  for (const { id, prefix } of PREFIXES) {
    if (Object.keys(annotations).some((k) => k.startsWith(prefix))) return id
  }
  const cls = doc.spec?.ingressClassName || ''
  for (const { id, match } of CLASS_HINTS) {
    if (match.test(cls)) return id
  }
  return 'generic'
}

/** Annotation keys each controller module explicitly understands — anything else with a
 *  matching prefix is flagged as a generic "not translated" warning instead of being silently
 *  dropped. */
export const HANDLED_ANNOTATIONS: Record<ControllerId, string[]> = {
  nginx: [
    'nginx.ingress.kubernetes.io/rewrite-target',
    'nginx.ingress.kubernetes.io/ssl-redirect',
    'nginx.ingress.kubernetes.io/force-ssl-redirect',
    'nginx.ingress.kubernetes.io/canary',
    'nginx.ingress.kubernetes.io/canary-weight',
    'nginx.ingress.kubernetes.io/canary-by-header',
    'nginx.ingress.kubernetes.io/canary-by-header-value',
    'nginx.ingress.kubernetes.io/canary-by-header-pattern',
    'nginx.ingress.kubernetes.io/canary-by-cookie',
  ],
  traefik: [
    'traefik.ingress.kubernetes.io/router.tls',
    'traefik.ingress.kubernetes.io/router.middlewares',
    'traefik.ingress.kubernetes.io/router.entrypoints',
  ],
  alb: [
    'alb.ingress.kubernetes.io/scheme',
    'alb.ingress.kubernetes.io/target-type',
    'alb.ingress.kubernetes.io/certificate-arn',
    'alb.ingress.kubernetes.io/group.name',
    'alb.ingress.kubernetes.io/listen-ports',
  ],
  kong: ['konghq.com/strip-path', 'konghq.com/plugins', 'konghq.com/protocols'],
  generic: [],
}

export interface ControllerNotes {
  /** extra annotations to merge onto the generated Gateway's metadata.annotations */
  gatewayAnnotations: Record<string, string>
  warnings: string[]
}

export function applyIngressLevelAnnotations(
  controller: ControllerId,
  annotations: Record<string, string>,
  context: string,
): ControllerNotes {
  const warnings: string[] = []
  const gatewayAnnotations: Record<string, string> = {}

  if (controller === 'traefik') {
    if (annotations['traefik.ingress.kubernetes.io/router.middlewares']) {
      warnings.push(
        `${context}: Traefik middleware "${annotations['traefik.ingress.kubernetes.io/router.middlewares']}" has no core Gateway API equivalent — recreate it as a Traefik Middleware CRD and attach it via an ExtensionRef filter on the HTTPRoute.`,
      )
    }
    if (annotations['traefik.ingress.kubernetes.io/router.entrypoints']) {
      warnings.push(
        `${context}: "router.entrypoints" was used to pick a listener — make sure the target Gateway's listener names/ports match ("${annotations['traefik.ingress.kubernetes.io/router.entrypoints']}").`,
      )
    }
  }

  if (controller === 'alb') {
    const scheme = annotations['alb.ingress.kubernetes.io/scheme']
    const targetType = annotations['alb.ingress.kubernetes.io/target-type']
    const certArn = annotations['alb.ingress.kubernetes.io/certificate-arn']
    const groupName = annotations['alb.ingress.kubernetes.io/group.name']
    if (scheme) gatewayAnnotations['alb.ingress.kubernetes.io/scheme'] = scheme
    if (targetType) gatewayAnnotations['alb.ingress.kubernetes.io/target-type'] = targetType
    if (certArn) {
      warnings.push(
        `${context}: ACM certificate ("${certArn}") was referenced via certificate-arn — the AWS Gateway API controller expects it as a "alb.ingress.kubernetes.io/certificate-arn" annotation on the Gateway (added automatically) rather than a Gateway API certificateRef; double-check listener TLS still resolves.`,
      )
      gatewayAnnotations['alb.ingress.kubernetes.io/certificate-arn'] = certArn
    }
    if (groupName) {
      warnings.push(
        `${context}: "group.name: ${groupName}" shares one ALB across Ingresses — this converter already merges Ingresses of the same ingressClassName onto one Gateway, but verify the grouping matches your ALB group exactly.`,
      )
    }
  }

  if (controller === 'kong') {
    if (annotations['konghq.com/plugins']) {
      warnings.push(
        `${context}: Kong plugin binding ("${annotations['konghq.com/plugins']}") has no core Gateway API equivalent — reattach it as a KongPlugin resource referenced via an ExtensionRef filter.`,
      )
    }
    if (annotations['konghq.com/protocols']) {
      warnings.push(
        `${context}: "protocols" restricted this route to specific protocols — mirror that by only attaching the HTTPRoute to the matching Gateway listener(s).`,
      )
    }
  }

  return { gatewayAnnotations, warnings }
}

export function stripPathFilter(controller: ControllerId, annotations: Record<string, string>): boolean {
  return controller === 'kong' && annotations['konghq.com/strip-path'] === 'true'
}

export function unhandledAnnotationWarning(
  controller: ControllerId,
  key: string,
  context: string,
): string | null {
  if (controller === 'generic') return null
  const prefix = PREFIXES.find((p) => p.id === controller)?.prefix
  if (!prefix || !key.startsWith(prefix)) return null
  if (HANDLED_ANNOTATIONS[controller].includes(key)) return null
  return `${context}: annotation "${key}" (${controllerLabels[controller]}) was not translated — review whether your Gateway controller needs an equivalent policy/filter.`
}
