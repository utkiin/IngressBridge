# IngressBridge

Convert Kubernetes `Ingress` manifests to [Gateway API](https://gateway-api.sigs.k8s.io/) (`Gateway`, `HTTPRoute`) right in your browser — free, instant, and nothing leaves your machine.

Not affiliated with the Kubernetes project or the official [kubernetes-sigs/ingress2gateway](https://github.com/kubernetes-sigs/ingress2gateway) CLI — this is an independent, best-effort web converter. See that project for the authoritative, cluster-aware migration path.

## Features

- Live conversion as you type — paste an Ingress, get Gateway API YAML back instantly
- Controller-aware annotation handling: NGINX (including canary weight/header traffic splitting), AWS ALB, Kong, Traefik
- Every non-trivial or lossy conversion is called out as an explicit warning instead of being silently dropped
- Light/dark theme, copy/download output, no sign-up, no server round-trip

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint      # oxlint
```

## Stack

React + TypeScript + Vite + Tailwind CSS v4.
