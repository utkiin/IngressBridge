export interface Example {
  id: string
  label: string
  description: string
  yaml: string
}

export const examples: Example[] = [
  {
    id: 'simple-tls',
    label: 'Single host with TLS',
    description: 'One host, one path, TLS termination via cert-manager secret.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-frontend
  namespace: shop
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - shop.example.com
      secretName: shop-example-com-tls
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-frontend-svc
                port:
                  number: 80
`,
  },
  {
    id: 'path-fanout',
    label: 'Multi-path fan-out',
    description: 'Single host routed to multiple backend services by path.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway
  namespace: platform
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /users
            pathType: Prefix
            backend:
              service:
                name: users-svc
                port:
                  number: 8080
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: orders-svc
                port:
                  number: 8080
          - path: /health
            pathType: Exact
            backend:
              service:
                name: health-svc
                port:
                  number: 8080
`,
  },
  {
    id: 'multi-host',
    label: 'Multiple hosts',
    description: 'Two independent hosts sharing the same ingress class.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: marketing-sites
  namespace: default
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  ingressClassName: nginx
  rules:
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: marketing-www
                port:
                  number: 80
    - host: blog.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: marketing-blog
                port:
                  number: 80
`,
  },
  {
    id: 'nginx-canary',
    label: 'NGINX canary (weighted)',
    description: 'A primary Ingress plus a 20%-weight canary — merged into one weighted HTTPRoute.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: checkout
  namespace: shop
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  ingressClassName: nginx
  rules:
    - host: checkout.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: checkout-stable
                port:
                  number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: checkout-canary
  namespace: shop
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "20"
spec:
  ingressClassName: nginx
  rules:
    - host: checkout.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: checkout-canary
                port:
                  number: 80
`,
  },
  {
    id: 'alb-basic',
    label: 'AWS ALB Ingress',
    description: 'Internet-facing ALB with an ACM certificate and IP target type.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: storefront
  namespace: default
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123
    alb.ingress.kubernetes.io/group.name: storefront-shared-alb
spec:
  ingressClassName: alb
  rules:
    - host: store.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: storefront-svc
                port:
                  number: 8080
`,
  },
  {
    id: 'kong-strip-path',
    label: 'Kong strip-path',
    description: 'Kong-managed API route that strips the matched prefix before proxying.',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: billing-api
  namespace: platform
  annotations:
    kubernetes.io/ingress.class: kong
    konghq.com/strip-path: "true"
    konghq.com/protocols: https
spec:
  ingressClassName: kong
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /billing
            pathType: Prefix
            backend:
              service:
                name: billing-svc
                port:
                  number: 8080
`,
  },
]
