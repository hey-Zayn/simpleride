# Deploying the Uber Backend on Google Cloud

This guide uses Google Kubernetes Engine (GKE) for the Dockerized microservices. GKE is the recommended GCP production target for this application because it needs private service-to-service networking, internal gRPC, independently scalable BullMQ workers, and durable Socket.IO connections.

## Target architecture

```text
Internet -> Cloud DNS -> Cloud Armor -> External HTTPS Load Balancer / GKE Gateway -> gateway pods
                                                                            |
                                      private GKE network ------------------+-- auth, ride, location, notification
                                                                            +-- location gRPC :50051

Private managed services: Cloud SQL PostgreSQL | Memorystore Redis | RabbitMQ cluster/provider
Images: Artifact Registry | Secrets: Secret Manager | Metrics/traces: Cloud Operations
```

Only the gateway is internet-facing. All APIs, gRPC, Redis, RabbitMQ, PostgreSQL, and management dashboards stay on private addresses. Keep the existing architecture: client HTTP through gateway, ride-to-location through gRPC, and service events through RabbitMQ.

## Before deploying

1. Pick one primary GCP region close to users. Put GKE, Cloud SQL, Memorystore, and RabbitMQ in the same region/VPC to eliminate cross-region latency from the ride-matching path.
2. Create separate projects for development, staging, and production, with separate service accounts and billing alerts.
3. Replace all development secrets (`guest/guest`, local `.env`, JWT values, email password) with Secret Manager values.
4. Harden the current Dockerfiles before releasing: they are single-stage Node 20 images. Use the repository’s required multi-stage Alpine build pattern, `npm ci`, Prisma generation where required, non-root users, immutable base-image digests, and image scanning.
5. Do not deploy Docker Compose to GKE. It is a local-development definition; use Kubernetes Deployments/Services instead.

## 1. Provision the GCP foundation

Create a custom VPC with private GKE nodes and Private Google Access. Use Cloud NAT for restricted outbound internet access. Create firewall rules that permit only:

- HTTPS to the external load balancer.
- Load balancer health checks to gateway.
- Required pod-to-pod routes within the cluster.
- Private database/cache/broker ports from approved workload identities only.

Provision these managed dependencies:

| App dependency | GCP service | Notes |
|---|---|---|
| PostgreSQL | Cloud SQL for PostgreSQL, HA | Private IP, backups/PITR, CMEK if required, dedicated least-privilege DB users. |
| Redis GEO + BullMQ | Memorystore for Redis, Standard Tier | Use the same region and private networking; validate the selected tier/version supports every Redis command used by the app. |
| RabbitMQ | RabbitMQ on private GKE nodes, or a managed RabbitMQ provider/private VM deployment | GCP does not provide a first-party managed RabbitMQ service. Keep it private, TLS-enabled, durable, monitored, and highly available. Do **not** replace it with Pub/Sub without an explicit application redesign, because this code uses AMQP/RabbitMQ semantics. |
| Secrets | Secret Manager + Workload Identity | Let each Kubernetes service account read only the secrets it needs. |
| Images | Artifact Registry | One Docker repository/image for each service. |

Use Cloud DNS for domains, Google-managed certificates for HTTPS, Cloud Armor before the external load balancer, and Cloud Logging/Monitoring plus OpenTelemetry for observability.

## 2. Create an Artifact Registry repository and publish images

Run in CI after tests. Substitute project, region, and commit SHA. Use an immutable commit tag, never only `latest`.

```bash
gcloud artifacts repositories create uber \
  --repository-format=docker \
  --location=<REGION> \
  --description="Uber backend images"

gcloud auth configure-docker <REGION>-docker.pkg.dev

docker build -t <REGION>-docker.pkg.dev/<PROJECT_ID>/uber/gateway:<GIT_SHA> backend/gateway
docker push <REGION>-docker.pkg.dev/<PROJECT_ID>/uber/gateway:<GIT_SHA>
```

Build and push the other four images from `backend/services/auth-service`, `location-service`, `notification-service`, and `ride-service`. Use Cloud Build or GitHub Actions Workload Identity Federation so CI does not store a long-lived GCP service-account key.

## 3. Create and configure GKE

Create a regional private GKE cluster across multiple zones. Enable Workload Identity, Gateway API, managed Prometheus, Cloud Logging, and NetworkPolicy (Dataplane V2 is a practical choice). Install External Secrets Operator or the Secret Manager add-on, metrics-server, and an OpenTelemetry collector if you need distributed traces outside Cloud Operations.

Use GKE Gateway with an external HTTPS load balancer. It is managed as Kubernetes Gateway resources; see the current [GKE Gateway deployment documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/deploying-gateways). Configure an HTTPS listener with a managed certificate and route all relevant paths to the gateway service.

## 4. Kubernetes deployment model

Make a Helm chart or `infra/k8s/` directory. Each deployable needs a `Deployment`, internal `ClusterIP` Service, readiness/liveness probes, HPA, PodDisruptionBudget, resource requests/limits, service account, and NetworkPolicy.

| Workload | Exposed externally? | Ports | Initial replicas | Primary scale signal |
|---|---:|---:|---:|---|
| gateway | Through Gateway only | 5000 | 2 | CPU, request rate, active sockets |
| auth-service | No | 4001 | 2 | CPU, request rate |
| location-service | No | 4002, 50051 | 2 | CPU, active sockets |
| notification-service | No | 4003 | 2 | Active sockets, queue lag |
| ride-service API | No | 4004 | 2 | CPU, request rate |
| ride-service worker | No | none | 1+ | BullMQ queue depth/lag |

The BullMQ worker must be a distinct deployment from the ride API. It should have explicit concurrency and idempotent job handlers. Introduce an outbox/idempotency mechanism before scaling consumers aggressively, so AMQP/BullMQ redelivery cannot create duplicate state or notifications.

Private service DNS/environment variables:

```text
AUTH_SERVICE_URL=http://auth-service:4001
LOCATION_SERVICE_GRPC_URL=location-service:50051
RABBITMQ_URL=amqps://<private-rabbitmq-host>:5671
REDIS_URI=rediss://<memorystore-private-ip>:6379
DATABASE_URL=postgresql://...@<cloud-sql-private-ip>:5432/<database>?sslmode=require
```

Use NetworkPolicies to deny all by default and only permit: gateway -> APIs; ride -> location gRPC/Redis/RabbitMQ/PostgreSQL; location -> Redis/RabbitMQ; notification -> RabbitMQ/PostgreSQL; auth -> its data dependencies. Do not add direct REST links between backend services.

## 5. Real-time traffic and public routing

Use one public `https://api.example.com` endpoint to the gateway; route both notification and location Socket.IO paths through it. Update frontend `NEXT_PUBLIC_GATEWAY_URL` and `NEXT_PUBLIC_LOCATION_SOCKET_URL` to the HTTPS/WSS public domain, rather than exposing `location-service:3002` publicly. This removes a separate public origin and makes CORS/TLS consistent.

Set a long backend timeout appropriate for active trips, configure gateway/Nginx WebSocket upgrade handling, and use WSS only. Add a Socket.IO Redis adapter using independent pub/sub connections so rooms and broadcasts work across notification/location pods. Do not rely on in-memory Socket.IO rooms or session affinity alone.

The frontend should prefer WebSocket transport and reconnect using exponential backoff. Test gateway failover, pod rollout, and reconnection while an active ride is in progress.

## 6. Database, secrets, and Prisma migration release

Create secrets in Secret Manager for JWT keys, DB URLs, RabbitMQ credentials, Redis connection details, SMTP credentials, CORS origins, and external API keys. Mount/sync them only into the matching workload; never print them in CI logs.

Run database migration as one release `Job`, not from every replica:

```bash
kubectl -n production create job --from=cronjob/uber-migrate uber-migrate-<GIT_SHA>
kubectl -n production wait --for=condition=complete job/uber-migrate-<GIT_SHA> --timeout=10m
```

Use compatible expand/contract migrations, asynchronous backfills, and a verified Cloud SQL backup before any destructive schema change. GCP documents [Cloud SQL PostgreSQL connections from GKE](https://cloud.google.com/sql/docs/postgres/connect-instance-kubernetes) and recommends [Secret Manager for sensitive values](https://cloud.google.com/sql/docs/postgres/use-secret-manager).

## 7. CI/CD, rollout, and operating checks

1. CI runs lint/tests, builds and scans images, pushes the immutable image tag, and renders Helm/Kustomize manifests.
2. Run migration job first; stop the release on failure.
3. Deploy to staging, smoke-test via the public Gateway, then promote the same image digest to production.
4. Use rolling updates with `maxUnavailable: 0`, short graceful shutdown/drain behavior, and a termination grace period so socket clients reconnect cleanly. Use canary releases for gateway and ride-service.
5. Verify login, fare estimate, ride request, gRPC nearby-driver lookup, Redis GEO search, RabbitMQ events, BullMQ expiry, Socket.IO broadcasts, reconnect, and email behavior.

Alert on load-balancer 5xx and latency, restarts, CPU/memory throttling, Cloud SQL CPU/connections/slow queries, Redis memory/latency/evictions, RabbitMQ queue depth/unacked messages, and BullMQ job age. Set maximum HPA replicas to protect Cloud SQL, Redis, and RabbitMQ from an uncontrolled burst.

## Why not make Cloud Run the primary design?

Cloud Run can run WebSockets and gRPC, but WebSocket requests are subject to configured request timeouts and instances with open sockets remain active/billed. New connections can also land on different instances, so Socket.IO must use shared state anyway. It is suitable for a small proof of concept, but the separate worker, internal gRPC, and long-lived real-time services make GKE the simpler production control plane here. See Google’s [WebSocket guidance](https://cloud.google.com/run/docs/triggering/websockets) and [Cloud Run fit guide](https://cloud.google.com/run/docs/fit-for-run).

## Important GCP references

- [GKE Gateway deployment](https://cloud.google.com/kubernetes-engine/docs/how-to/deploying-gateways)
- [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [Cloud SQL from GKE](https://cloud.google.com/sql/docs/postgres/connect-instance-kubernetes)
- [Artifact Registry build/push example](https://cloud.google.com/sql/docs/postgres/connect-instance-kubernetes)
