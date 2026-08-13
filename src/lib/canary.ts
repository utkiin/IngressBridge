export interface ParsedBackendRef {
  name: string
  port: number
  kind: 'Service'
  weight?: number
}

export interface ParsedHeaderMatch {
  name: string
  value: string
  type: 'Exact' | 'RegularExpression'
}

export interface ParsedMatch {
  path: { type: string; value: string }
  headers?: ParsedHeaderMatch[]
}

export interface ParsedRule {
  matches: ParsedMatch[]
  filters?: unknown[]
  backendRefs: ParsedBackendRef[]
}

export interface CanaryInfo {
  weight?: number
  header?: { name: string; value?: string; pattern?: string }
  cookie?: string
}

export interface ParsedIngress {
  key: string
  name: string
  namespace: string
  ingressClass: string
  gatewayName: string
  hostnames: string[]
  rules: ParsedRule[]
  canary?: CanaryInfo
}

export function parseCanaryAnnotations(annotations: Record<string, string>): CanaryInfo | undefined {
  if (annotations['nginx.ingress.kubernetes.io/canary'] !== 'true') return undefined

  const headerName = annotations['nginx.ingress.kubernetes.io/canary-by-header']
  const headerValue = annotations['nginx.ingress.kubernetes.io/canary-by-header-value']
  const headerPattern = annotations['nginx.ingress.kubernetes.io/canary-by-header-pattern']
  const cookie = annotations['nginx.ingress.kubernetes.io/canary-by-cookie']
  const weightStr = annotations['nginx.ingress.kubernetes.io/canary-weight']

  if (headerName) return { header: { name: headerName, value: headerValue, pattern: headerPattern } }
  if (cookie) return { cookie }
  if (weightStr !== undefined) {
    const weight = Number(weightStr)
    if (!Number.isNaN(weight)) return { weight }
  }
  return {}
}

function samePath(a: ParsedRule, b: ParsedRule): boolean {
  const pa = a.matches[0]?.path
  const pb = b.matches[0]?.path
  return !!pa && !!pb && pa.type === pb.type && pa.value === pb.value
}

function describePath(rule: ParsedRule): string {
  const p = rule.matches[0]?.path
  return p ? `${p.type} "${p.value}"` : '(no path)'
}

/**
 * Folds nginx canary Ingresses into the matching primary Ingress's HTTPRoute rules
 * (weighted backendRefs for canary-weight, a preceding header-matched rule for
 * canary-by-header) and drops the standalone canary entries from the output.
 */
export function mergeCanaries(ingresses: ParsedIngress[], warn: (msg: string) => void): ParsedIngress[] {
  const canaries = ingresses.filter((i) => i.canary)
  if (canaries.length === 0) return ingresses

  const consumed = new Set<ParsedIngress>()

  for (const canary of canaries) {
    const primary = ingresses.find((p) => p !== canary && !p.canary && p.key === canary.key)
    const ctx = `Ingress "${canary.namespace}/${canary.name}"`

    if (!primary) {
      warn(`${ctx}: canary annotations found but no matching primary Ingress (same namespace + hostnames) — treated as a standalone route.`)
      continue
    }

    consumed.add(canary)

    const info = canary.canary!
    const hasSelector = info.header || info.cookie || info.weight !== undefined
    if (!hasSelector) {
      warn(`${ctx}: marked as canary but has no canary-weight, canary-by-header, or canary-by-cookie — skipped, nothing to merge.`)
      continue
    }

    for (const canaryRule of canary.rules) {
      const primaryRule = primary.rules.find((r) => samePath(r, canaryRule))
      const canaryBackend = canaryRule.backendRefs[0]
      if (!canaryBackend) continue

      if (!primaryRule) {
        warn(`${ctx}: canary path ${describePath(canaryRule)} has no matching path on primary Ingress "${primary.name}" — kept as its own rule instead of being merged.`)
        primary.rules.push(canaryRule)
        continue
      }

      if (info.header) {
        primary.rules.unshift({
          matches: [
            {
              path: primaryRule.matches[0].path,
              headers: [
                {
                  name: info.header.name,
                  value: info.header.pattern ?? info.header.value ?? '',
                  type: info.header.pattern ? 'RegularExpression' : 'Exact',
                },
              ],
            },
          ],
          backendRefs: [{ ...canaryBackend, weight: undefined }],
        })
        warn(`${ctx}: header-based canary ("${info.header.name}") converted to a header-matched rule placed ahead of the primary rule. Gateway API resolves overlapping matches by specificity, but always verify routing on your controller.`)
      } else if (info.cookie) {
        warn(`${ctx}: cookie-based canary ("${info.cookie}") has no equivalent in core Gateway API — HTTPRoute has no cookie matcher. Merge this manually or use your controller's extension filters.`)
      } else if (info.weight !== undefined) {
        const w = Math.max(0, Math.min(100, info.weight))
        primaryRule.backendRefs = primaryRule.backendRefs.map((b) => ({
          ...b,
          weight: b.weight ?? 100 - w,
        }))
        primaryRule.backendRefs.push({ ...canaryBackend, weight: w })
        warn(`${ctx}: canary-weight ${w}% merged into the primary route as weighted backendRefs (native Gateway API traffic splitting).`)
      }
    }
  }

  return ingresses.filter((i) => !consumed.has(i))
}
