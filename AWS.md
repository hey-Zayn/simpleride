# Deploying the Uber Backend on AWS

This guide deploys the backend as independent Dockerized microservices on Amazon EKS. It is the recommended production topology because the platform has long-lived Socket.IO connections, internal gRPC traffic, BullMQ workers, and services that need independent scaling.

## Target architecture

```text
Internet -> Route 53 -> AWS WAF -> HTTPS ALB -> gateway pods
                                               |
                         private EKS network ---+-- auth-service
                                               +-- location-service (HTTP/WS + gRPC :50051)
                                               +-- notification-service (Socket.IO)
                                               +-- ride-service + BullMQ worker

Private data layer: RDS PostgreSQL | ElastiCache Redis | Amazon MQ for RabbitMQ
Secrets: AWS Secrets Manager       Images: Amazon ECR
```

Only the gateway is public. Auth, ride, notification, location, RabbitMQ, Redis, PostgreSQL, and gRPC must be private. The gateway continues to be the only external HTTP entry point; ride-to-location stays gRPC and lifecycle communication stays on the `ride_events` RabbitMQ exchange.

## Before deploying

1. Create separate `dev`, `staging`, and `production` AWS accounts or at least separate VPCs/namespaces. Use one AWS Region close to your riders and drivers; place all latency-sensitive resources in that region.
2. Replace development credentials. In particular, never deploy `guest/guest` RabbitMQ credentials, checked-in `.env` files, Gmail passwords, or JWT secrets.
3. Add a `/healthz` readiness endpoint and a `/livez` liveness endpoint to every service if they are not already present. A readiness check must verify only dependencies required to serve traffic, with a short timeout.
4. Remove Compose bind mounts and host port mappings from the production workflow. Docker Compose is for local development; EKS networking replaces it.
5. The current Dockerfiles use single-stage Node 20 images. Before the first production release, convert them to the repository-required multi-stage Alpine builds, run `npm ci`, generate Prisma client where required, run as a non-root user, and pin the base-image digest. Do not run migrations from every application replica.

## 1. Create AWS foundations

Create a VPC spanning at least two Availability Zones:

- Public subnets: ALB and NAT gateways.
- Private application subnets: EKS nodes/pods.
- Private data subnets: RDS, ElastiCache, and Amazon MQ.
- Security groups: ALB accepts `443` from the internet; EKS accepts application traffic only from ALB; data services accept their native ports only from the EKS security group.

Provision managed dependencies:

| App dependency | AWS service | Notes |
|---|---|---|
| PostgreSQL | Amazon RDS for PostgreSQL (Multi-AZ) | Create least-privilege DB users/databases per service; enable automated backups and encryption. |
| Redis GEO + BullMQ | ElastiCache for Redis/Valkey | Use a replication group with Multi-AZ and automatic failover; keep it private. Confirm the selected engine supports the Redis commands your app uses. |
| RabbitMQ | Amazon MQ for RabbitMQ | Use private endpoints, TLS, durable queues/messages, broker backups, and non-default users. Amazon MQ runs RabbitMQ without requiring application protocol rewrites. |
| Secrets | AWS Secrets Manager + IRSA | One secret per environment/service; pods read only their own secrets. |
| Images | Amazon ECR | One repository per deployable: gateway, auth, location, notification, ride. |

Use an ACM certificate for `api.example.com` (and, if required, `app.example.com`). Manage the domain in Route 53. Enable CloudWatch logs, Container Insights/OpenTelemetry collection, AWS WAF, and backups before the application is exposed.

## 2. Build and publish the five images

Run these commands in CI after tests. Replace placeholders; use an immutable Git SHA tag rather than `latest`.

```bash
aws ecr create-repository --repository-name uber/gateway
aws ecr create-repository --repository-name uber/auth-service
aws ecr create-repository --repository-name uber/location-service
aws ecr create-repository --repository-name uber/notification-service
aws ecr create-repository --repository-name uber/ride-service

aws ecr get-login-password --region <REGION> | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

docker build -t uber/gateway:<GIT_SHA> backend/gateway
docker tag uber/gateway:<GIT_SHA> <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/uber/gateway:<GIT_SHA>
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/uber/gateway:<GIT_SHA>
```

Repeat the final three commands for each service directory. Scan images with ECR enhanced scanning and block releases with critical, unapproved vulnerabilities.

## 3. Create EKS and install cluster components

Create a private EKS cluster across the private subnets with at least two node groups/AZs. Attach IAM Roles for Service Accounts (IRSA) to workloads that read secrets or write logs. Install:

- AWS Load Balancer Controller (or EKS Auto Mode) for the ALB ingress.
- ExternalDNS (optional) to manage Route 53 records.
- cert-manager only if using certificates other than ACM/ALB termination.
- External Secrets Operator to sync narrowly scoped Secrets Manager values into Kubernetes Secrets.
- metrics-server, Prometheus/Grafana or an OpenTelemetry collector, and a log agent.
- Cluster Autoscaler or Karpenter plus Horizontal Pod Autoscalers.

An EKS `Ingress` provisions an Application Load Balancer through the AWS Load Balancer Controller; ALB is appropriate for HTTP(S) and WebSockets. Follow the current [AWS ALB Ingress documentation](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html) and [controller installation guide](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html).

## 4. Kubernetes workload layout

Create an `infra/k8s/` directory (or Helm chart) with the following resources. Each service gets a `Deployment`, internal `ClusterIP` `Service`, PodDisruptionBudget, ResourceQuota/LimitRange, HPA, NetworkPolicy, and `ServiceAccount`.

| Workload | Public? | Service port | Initial replicas | Scaling signal |
|---|---:|---:|---:|---|
| gateway | Yes, through ALB | 5000 | 2 | CPU, memory, request rate, active sockets |
| auth-service | No | 4001 | 2 | CPU, request rate |
| location-service | No | 4002 and 50051 | 2 | CPU, memory, active sockets |
| notification-service | No | 4003 | 2 | CPU, active sockets, queue depth |
| ride-service API | No | 4004 | 2 | CPU, request rate |
| ride-service worker | No | none | 1+ | BullMQ queue depth/lag |

Run the BullMQ worker as a separate deployment from the ride API so API scaling does not accidentally multiply job processing. Design the worker jobs as idempotent and configure only the intended worker concurrency. Publish events with an outbox/idempotency strategy before increasing replicas, otherwise retries can produce duplicate notifications.

Use service DNS names in environment variables:

```text
AUTH_SERVICE_URL=http://auth-service:4001
LOCATION_SERVICE_GRPC_URL=location-service:50051
RABBITMQ_URL=amqps://<private-amazon-mq-endpoint>
REDIS_URI=rediss://<private-elasticache-endpoint>:6379
DATABASE_URL=postgresql://...@<private-rds-endpoint>:5432/<database>?sslmode=require
```

Use an internal `NetworkPolicy` allow list: gateway -> all APIs; ride -> location `50051`, Redis, RabbitMQ, PostgreSQL; location -> Redis/RabbitMQ; notification -> RabbitMQ/PostgreSQL; auth -> PostgreSQL/Redis as needed. Deny all other east-west traffic.

## 5. Public ingress, TLS, and Socket.IO

Expose a single ALB route to the gateway. Keep the existing Nginx logic only if it provides application-specific routing; otherwise the ALB can send traffic directly to the gateway service. Do not expose `location-service:4002` directly—update `NEXT_PUBLIC_LOCATION_SOCKET_URL` to the public gateway domain and route the location WebSocket path through gateway/ingress. This avoids a second public load balancer and CORS mismatch.

Illustrative ingress annotations:

```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:<REGION>:<ACCOUNT_ID>:certificate/<ID>
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=3600
spec:
  ingressClassName: alb
```

Use HTTPS/WSS only, configure CORS to the production frontend origin, and set secure cookie flags (`Secure`, `HttpOnly`, suitable `SameSite`). Socket.IO needs a shared adapter for multi-replica notification/location services: use the Socket.IO Redis adapter with separate pub/sub connections, not in-memory rooms. Ensure the frontend prefers `transports: ['websocket']` and reconnects with backoff.

## 6. Secrets and database migrations

Store environment values in Secrets Manager, not source control or plain Kubernetes manifests: JWT access/refresh secrets, database URLs, RabbitMQ URL/user/password, Redis URL, SMTP credentials, frontend origins, and third-party API keys.

Deploy Prisma migrations as one versioned Kubernetes `Job` in the release pipeline:

```bash
kubectl -n production create job --from=cronjob/uber-migrate uber-migrate-<GIT_SHA>
kubectl -n production wait --for=condition=complete job/uber-migrate-<GIT_SHA> --timeout=10m
```

Use expand/contract migrations: add compatible schema first, deploy code that writes both forms if needed, backfill asynchronously, then remove old fields in a later release. Take and verify an RDS snapshot before destructive schema operations.

## 7. Release process and checks

1. CI: lint, tests, dependency/image scan, build immutable images, push to ECR, generate a release manifest.
2. Deploy migration job; stop if it fails.
3. Apply Helm/Kustomize manifests to staging, run smoke tests through the ALB, then promote the same image digest to production.
4. Use rolling deployments (`maxUnavailable: 0`, small `maxSurge`) and `preStop`/termination grace periods so WebSocket clients can reconnect cleanly. Consider canary deployment for gateway and ride-service.
5. Verify `/healthz`, JWT login, ride estimate/request, gRPC nearby-driver lookup, RabbitMQ event consumption, BullMQ expiry, and Socket.IO receive/reconnect.

Alert on ALB 5xx/latency, pod restarts, CPU/memory throttling, RDS connections/CPU, Redis memory/evictions/latency, RabbitMQ queue depth/unacked messages, and BullMQ job lag. Test an AZ/pod failure and RDS restore procedure before calling the setup production-ready.

## Important AWS references

- [Amazon MQ for RabbitMQ](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/working-with-rabbitmq.html)
- [EKS ALB routing](https://docs.aws.amazon.com/eks/latest/userguide/alb-ingress.html)
- [EKS workload scaling guidance](https://docs.aws.amazon.com/eks/latest/best-practices/scale-workloads.html)
- [Amazon ECR overview](https://aws.amazon.com/documentation-overview/ecr/)
