import { FlowchartData, StructureData, Dataset, DriveFile } from '../types';

export const STARTER_FLOWCHARTS: FlowchartData[] = [
  {
    id: 'fc_auth_zero_trust',
    title: 'Adaptive Zero-Trust Authentication Pipeline',
    description: 'Autonomous risk-scoring gateway with WebAuthn biometrics, geo-velocity evaluation, and JWT token issuance.',
    category: 'Security Architecture',
    nodes: [
      { id: 'n1', label: 'TLS Handshake & Ingress', type: 'start', description: 'Client submits credentials with device signature over mutual TLS', x: 260, y: 30, stateVariable: 'stage = "INGRESS"' },
      { id: 'n2', label: 'Rate Limiting & Token Bucket', type: 'process', description: 'Redis cluster verifies IP request quota (max 60 req/min)', x: 260, y: 130, stateVariable: 'rateLimitOk = true' },
      { id: 'n3', label: 'Argon2id Hash Verify', type: 'process', description: 'Compute cryptographic hash with 64MB memory cost factor', x: 260, y: 230, stateVariable: 'passwordValid = true' },
      { id: 'n4', label: 'Risk Score <= 25?', type: 'decision', description: 'ML inference calculates anomaly coefficient based on ASN and time', x: 260, y: 340, stateVariable: 'riskScore = 14' },
      { id: 'n5', label: 'Direct JWT Issuance', type: 'process', description: 'Sign RS256 token with 15-minute expiration timestamp', x: 100, y: 460, stateVariable: 'tokenIssued = true' },
      { id: 'n6', label: 'Challenge FIDO2 / WebAuthn', type: 'delay', description: 'Issue cryptographic challenge to hardware security key', x: 420, y: 460, stateVariable: 'challengeSent = true' },
      { id: 'n7', label: 'Passkey Signed?', type: 'decision', description: 'Verify attestation statement and public key counter', x: 420, y: 570, stateVariable: 'hardwareSigned = true' },
      { id: 'n8', label: 'Grant Workspace Access', type: 'end', description: 'Attach session cookie and redirect to active tenant dashboard', x: 260, y: 690, stateVariable: 'authenticated = true' },
      { id: 'n9', label: 'Quarantine & SecOps Alert', type: 'end', description: 'Invalidate credential cache and notify incident response queue', x: 600, y: 570, stateVariable: 'quarantine = true' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', label: 'TCP Established' },
      { id: 'e2', from: 'n2', to: 'n3', label: 'Quota Available' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'Credentials Match' },
      { id: 'e4', from: 'n4', to: 'n5', label: 'Low Risk (Score <= 25)' },
      { id: 'e5', from: 'n4', to: 'n6', label: 'Elevated Risk' },
      { id: 'e6', from: 'n5', to: 'n8', label: 'Claims Injected' },
      { id: 'e7', from: 'n6', to: 'n7', label: 'Signature Received' },
      { id: 'e8', from: 'n7', to: 'n8', label: 'Key Validated' },
      { id: 'e9', from: 'n7', to: 'n9', label: 'Attestation Failed' },
    ],
    simulation: {
      entryNodeId: 'n1',
      steps: [
        { stepIndex: 1, nodeId: 'n1', actionDescription: 'Incoming POST /api/v1/session received from verified Chrome client', stateSummary: '{ ingress: "TLS_1_3", ip: "198.51.100.24" }' },
        { stepIndex: 2, nodeId: 'n2', actionDescription: 'Redis token bucket confirms client within 15req/min allowance', stateSummary: '{ rateLimitOk: true, remainingQuota: 45 }' },
        { stepIndex: 3, nodeId: 'n3', actionDescription: 'Argon2id password verification completed in 48ms', stateSummary: '{ passwordValid: true, algorithm: "Argon2id" }' },
        { stepIndex: 4, nodeId: 'n4', actionDescription: 'Risk engine computes score: 14/100 (Known location, familiar device)', stateSummary: '{ riskScore: 14, bypassMfa: true }' },
        { stepIndex: 5, nodeId: 'n5', actionDescription: 'Minting asymmetric RS256 token with tenant scopes', stateSummary: '{ token: "eyJhbGciOi...", exp: 900 }' },
        { stepIndex: 6, nodeId: 'n8', actionDescription: 'Authentication verified. Session established successfully.', stateSummary: '{ authenticated: true, status: "READY" }' },
      ],
    },
    mermaid: `graph TD
  n1([TLS Handshake & Ingress]) --> n2[Rate Limiting & Token Bucket]
  n2 --> n3[Argon2id Hash Verify]
  n3 --> n4{Risk Score <= 25?}
  n4 -- Low Risk --> n5[Direct JWT Issuance]
  n4 -- High Risk --> n6[Challenge FIDO2 / WebAuthn]
  n5 --> n8([Grant Workspace Access])
  n6 --> n7{Passkey Signed?}
  n7 -- Yes --> n8
  n7 -- No --> n9([Quarantine & Alert])`,
  },
  {
    id: 'fc_ecommerce_order',
    title: 'High-Concurrency Order Settlement Pipeline',
    description: 'Event-driven distributed transaction with Redis distributed locks, stripe capture, and idempotent outbox publishing.',
    category: 'Distributed Systems',
    nodes: [
      { id: 'o1', label: 'Order Intent Created', type: 'start', description: 'Customer checks out shopping bag via checkout session', x: 260, y: 30, stateVariable: 'orderStatus = "CREATED"' },
      { id: 'o2', label: 'Acquire Inventory Lock', type: 'process', description: 'Distributed Redlock on SKU inventory keys (TTL 120s)', x: 260, y: 130, stateVariable: 'lockAcquired = true' },
      { id: 'o3', label: 'Stock Available?', type: 'decision', description: 'Atomic decrement in Redis cluster', x: 260, y: 230, stateVariable: 'stockRemaining = 32' },
      { id: 'o4', label: 'Capture Payment Intent', type: 'process', description: 'Synchronous payment authorization against Stripe gateway', x: 120, y: 350, stateVariable: 'chargeCaptured = true' },
      { id: 'o5', label: 'Release Lock & Notify Out-of-Stock', type: 'end', description: 'Release inventory reservation and prompt customer alternatives', x: 420, y: 350, stateVariable: 'orderStatus = "CANCELLED"' },
      { id: 'o6', label: 'Payment Succeeded?', type: 'decision', description: 'Webhook verification with HMAC-SHA256 signature', x: 120, y: 460, stateVariable: 'paid = true' },
      { id: 'o7', label: 'Transactional Outbox Write', type: 'process', description: 'Commit Postgres order row + outbox event in single ACID transaction', x: 120, y: 570, stateVariable: 'outboxWritten = true' },
      { id: 'o8', label: 'Publish to Kafka Fulfillment', type: 'end', description: 'Debezium CDC tails outbox to warehouse logistics queue', x: 120, y: 680, stateVariable: 'orderStatus = "FULFILLING"' },
    ],
    edges: [
      { id: 'oe1', from: 'o1', to: 'o2', label: 'POST /checkout' },
      { id: 'oe2', from: 'o2', to: 'o3', label: 'Mutex Granted' },
      { id: 'oe3', from: 'o3', to: 'o4', label: 'Stock > 0' },
      { id: 'oe4', from: 'o3', to: 'o5', label: 'Depleted' },
      { id: 'oe5', from: 'o4', to: 'o6', label: 'Gateway Response' },
      { id: 'oe6', from: 'o6', to: 'o7', label: 'Captured 200' },
      { id: 'oe7', from: 'o7', to: 'o8', label: 'CDC Stream' },
    ],
    simulation: {
      entryNodeId: 'o1',
      steps: [
        { stepIndex: 1, nodeId: 'o1', actionDescription: 'Cart checkout event fired for $184.50 payload', stateSummary: '{ cartId: "cart_992", items: 2 }' },
        { stepIndex: 2, nodeId: 'o2', actionDescription: 'Redlock acquired across 3 Redis sentinel nodes', stateSummary: '{ lockKey: "inv:sku_881", ttl: 120 }' },
        { stepIndex: 3, nodeId: 'o3', actionDescription: 'Inventory count verified: 32 units available', stateSummary: '{ stockRemaining: 31 }' },
        { stepIndex: 4, nodeId: 'o4', actionDescription: 'Stripe PaymentIntent captured successfully', stateSummary: '{ stripeId: "pi_3M2z4...", amount: 18450 }' },
        { stepIndex: 5, nodeId: 'o6', actionDescription: 'Payment authorization verified via HMAC webhook', stateSummary: '{ paymentStatus: "SUCCEEDED" }' },
        { stepIndex: 6, nodeId: 'o7', actionDescription: 'PostgreSQL ACID transaction committed in 6.1ms', stateSummary: '{ orderId: "ord_5521", outbox: "SAVED" }' },
        { stepIndex: 7, nodeId: 'o8', actionDescription: 'Kafka event published to warehouse fulfillment cluster', stateSummary: '{ orderStatus: "FULFILLING" }' },
      ],
    },
    mermaid: `graph TD
  o1([Order Intent Created]) --> o2[Acquire Inventory Lock]
  o2 --> o3{Stock Available?}
  o3 -- Yes --> o4[Capture Payment Intent]
  o3 -- No --> o5([Release & Notify])
  o4 --> o6{Payment Succeeded?}
  o6 -- Yes --> o7[Transactional Outbox Write]
  o7 --> o8([Publish to Kafka])`,
  },
];

export const STARTER_STRUCTURES: StructureData[] = [
  {
    id: 'struct_saas_multi_tenant',
    title: 'Enterprise Multi-Tenant SaaS Relational Schema',
    description: 'PostgreSQL 16 relational data architecture featuring tenant isolation, role-based access control, billing subscription ledger, and audit trails.',
    type: 'relational',
    tables: [
      {
        name: 'tenants',
        description: 'Root isolation boundary for multi-tenant accounts',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Tenant unique identifier' },
          { name: 'name', type: 'VARCHAR(255)', isPrimary: false, nullable: false, description: 'Company or team name' },
          { name: 'subdomain', type: 'VARCHAR(63)', isPrimary: false, nullable: false, description: 'Unique routing DNS subdomain' },
          { name: 'tier', type: 'VARCHAR(32)', isPrimary: false, nullable: false, description: 'starter | growth | enterprise' },
          { name: 'max_seats', type: 'INTEGER', isPrimary: false, nullable: false, description: 'Seat allocation cap' },
          { name: 'created_at', type: 'TIMESTAMPTZ', isPrimary: false, nullable: false, description: 'Account creation time' },
        ],
        indexes: ['idx_tenants_subdomain', 'idx_tenants_tier'],
      },
      {
        name: 'users',
        description: 'Tenant members with credentials and permissions',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Primary user ID' },
          { name: 'tenant_id', type: 'UUID', isPrimary: false, nullable: false, foreignKey: 'tenants.id', description: 'Parent tenant ID' },
          { name: 'email', type: 'VARCHAR(320)', isPrimary: false, nullable: false, description: 'Unique workspace email' },
          { name: 'role', type: 'VARCHAR(32)', isPrimary: false, nullable: false, description: 'owner | admin | editor | viewer' },
          { name: 'two_factor_enabled', type: 'BOOLEAN', isPrimary: false, nullable: false, description: 'Security enforcement' },
          { name: 'last_login_at', type: 'TIMESTAMPTZ', isPrimary: false, nullable: true, description: 'Last active session' },
        ],
        indexes: ['idx_users_tenant_email', 'idx_users_role'],
      },
      {
        name: 'subscriptions',
        description: 'Stripe billing linkage and renewal cadence',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Subscription ID' },
          { name: 'tenant_id', type: 'UUID', isPrimary: false, nullable: false, foreignKey: 'tenants.id', description: 'Billed tenant' },
          { name: 'stripe_customer_id', type: 'VARCHAR(128)', isPrimary: false, nullable: false, description: 'Stripe customer reference' },
          { name: 'mrr_cents', type: 'BIGINT', isPrimary: false, nullable: false, description: 'Monthly recurring revenue' },
          { name: 'status', type: 'VARCHAR(32)', isPrimary: false, nullable: false, description: 'active | trialing | past_due' },
          { name: 'current_period_end', type: 'TIMESTAMPTZ', isPrimary: false, nullable: false, description: 'Billing cycle cut-off' },
        ],
        indexes: ['idx_subscriptions_tenant', 'idx_subscriptions_status'],
      },
      {
        name: 'audit_logs',
        description: 'Immutable regulatory activity ledger',
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true, nullable: false, description: 'Event identifier' },
          { name: 'tenant_id', type: 'UUID', isPrimary: false, nullable: false, foreignKey: 'tenants.id', description: 'Tenant scope' },
          { name: 'actor_id', type: 'UUID', isPrimary: false, nullable: false, foreignKey: 'users.id', description: 'User performing action' },
          { name: 'action', type: 'VARCHAR(128)', isPrimary: false, nullable: false, description: 'e.g. user.invite, api_key.rotate' },
          { name: 'ip_address', type: 'INET', isPrimary: false, nullable: false, description: 'Client origin IP' },
          { name: 'metadata', type: 'JSONB', isPrimary: false, nullable: true, description: 'Detailed change delta' },
        ],
        indexes: ['idx_audit_tenant_action', 'idx_audit_timestamp'],
      },
    ],
    relations: [
      { fromTable: 'users', fromCol: 'tenant_id', toTable: 'tenants', toCol: 'id', cardinality: 'many_to_one' },
      { fromTable: 'subscriptions', fromCol: 'tenant_id', toTable: 'tenants', toCol: 'id', cardinality: 'many_to_one' },
      { fromTable: 'audit_logs', fromCol: 'tenant_id', toTable: 'tenants', toCol: 'id', cardinality: 'many_to_one' },
      { fromTable: 'audit_logs', fromCol: 'actor_id', toTable: 'users', toCol: 'id', cardinality: 'many_to_one' },
    ],
    typescriptDefinition: `export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  tier: 'starter' | 'growth' | 'enterprise';
  max_seats: number;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  two_factor_enabled: boolean;
  last_login_at: string | null;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  stripe_customer_id: string;
  mrr_cents: number;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  current_period_end: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  ip_address: string;
  metadata?: Record<string, unknown>;
}`,
    sqlDdl: `-- PostgreSQL 16 Multi-Tenant DDL
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  tier VARCHAR(32) NOT NULL DEFAULT 'growth',
  max_seats INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'editor',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  CONSTRAINT unq_tenant_user_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(128) NOT NULL,
  mrr_cents BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(128) NOT NULL,
  ip_address INET NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);`,
    sampleRecords: [
      { id: 't_001', name: 'Apex Logistics Inc', subdomain: 'apex-logistics', tier: 'enterprise', max_seats: 150, created_at: '2026-01-14T08:00:00Z' },
      { id: 'u_101', tenant_id: 't_001', email: 'elena.rostova@apex.io', role: 'owner', two_factor_enabled: true, last_login_at: '2026-10-19T06:12:00Z' },
      { id: 'sub_901', tenant_id: 't_001', stripe_customer_id: 'cus_N8b2x14', mrr_cents: 240000, status: 'active', current_period_end: '2026-11-14T08:00:00Z' },
      { id: 'aud_501', tenant_id: 't_001', actor_id: 'u_101', action: 'api_key.create', ip_address: '198.51.100.42', created_at: '2026-10-19T06:14:22Z' },
    ],
  },
  {
    id: 'struct_delivery_lifecycle',
    title: 'Autonomous Package Delivery State Machine',
    description: 'Deterministic finite state automaton managing dispatch, route checkpoints, failure handling, and proof-of-delivery confirmation.',
    type: 'state_machine',
    stateMachine: {
      initialState: 'Manifest Created',
      states: [
        { name: 'Manifest Created', description: 'Barcode generated at fulfillment sorting center', isTerminal: false },
        { name: 'Dispatched to Hub', description: 'Package loaded on freight transit carrier', isTerminal: false },
        { name: 'Out for Final Delivery', description: 'Courier van scanned package into local route', isTerminal: false },
        { name: 'Delivery Attempted', description: 'Customer unavailable; rescheduling next morning window', isTerminal: false },
        { name: 'Delivered with Proof', description: 'Photo confirmation captured and customer notified', isTerminal: true },
        { name: 'Returned to Sender', description: 'Max retry attempts exhausted; returning to source', isTerminal: true },
      ],
      transitions: [
        { from: 'Manifest Created', to: 'Dispatched to Hub', event: 'SCAN_FREIGHT', guard: 'weightChecksumValid == true' },
        { from: 'Dispatched to Hub', to: 'Out for Final Delivery', event: 'VAN_LOADED', guard: 'driverAssigned == true' },
        { from: 'Out for Final Delivery', to: 'Delivered with Proof', event: 'CUSTOMER_CONFIRMED', guard: 'gpsProximity <= 50m' },
        { from: 'Out for Final Delivery', to: 'Delivery Attempted', event: 'ACCESS_RESTRICTED', guard: 'attemptCount < 3' },
        { from: 'Delivery Attempted', to: 'Out for Final Delivery', event: 'RESCHEDULE_RUN', guard: 'windowScheduled == true' },
        { from: 'Delivery Attempted', to: 'Returned to Sender', event: 'EXCEEDED_ATTEMPTS', guard: 'attemptCount >= 3' },
      ],
    },
    typescriptDefinition: `export type DeliveryState =
  | 'Manifest Created'
  | 'Dispatched to Hub'
  | 'Out for Final Delivery'
  | 'Delivery Attempted'
  | 'Delivered with Proof'
  | 'Returned to Sender';

export type DeliveryEvent =
  | 'SCAN_FREIGHT'
  | 'VAN_LOADED'
  | 'CUSTOMER_CONFIRMED'
  | 'ACCESS_RESTRICTED'
  | 'RESCHEDULE_RUN'
  | 'EXCEEDED_ATTEMPTS';

export interface TransitionContext {
  packageId: string;
  attemptCount: number;
  gpsProximityMeters: number;
  driverId: string;
}`,
    sampleRecords: [
      { packageId: 'PKG_882194', currentState: 'Out for Final Delivery', attemptCount: 1, lastScanHub: 'JFK-Hub-North', eta: '14:30 EST' },
      { packageId: 'PKG_991402', currentState: 'Delivered with Proof', attemptCount: 1, proofPhotoUri: 's3://proof/img_991402.jpg', deliveredAt: '11:15 EST' },
    ],
  },
  {
    id: 'struct_cloud_resource_tree',
    title: 'Cloud Infrastructure Resource Topology Tree',
    description: 'Hierarchical tree organizing global cloud regions, VPC networks, Kubernetes clusters, and microservice workloads.',
    type: 'tree',
    tree: {
      name: 'Global Cloud Network',
      type: 'root',
      attributes: { totalNodes: 28, uptime: '99.995%', monthlyCost: '$18,420' },
      children: [
        {
          name: 'us-east-1 (N. Virginia)',
          type: 'region',
          attributes: { latency: '18ms', activePods: 142 },
          children: [
            {
              name: 'Production VPC-01',
              type: 'vpc',
              attributes: { cidr: '10.0.0.0/16', natGateways: 3 },
              children: [
                { name: 'EKS Cluster "Prod-Core"', type: 'cluster', attributes: { version: '1.30', nodes: 24 } },
                { name: 'Aurora Postgres Multi-AZ', type: 'database', attributes: { storageGb: 4000, iops: 12000 } },
                { name: 'Redis Sentinel Quorum', type: 'cache', attributes: { memoryMb: 32768, hitRate: '98.4%' } },
              ],
            },
            {
              name: 'Ingress CDN Edge',
              type: 'edge',
              attributes: { bandwidthGbps: 40, certExpiryDays: 82 },
            },
          ],
        },
        {
          name: 'eu-west-1 (Ireland)',
          type: 'region',
          attributes: { latency: '72ms', activePods: 68 },
          children: [
            {
              name: 'GDPR Compliant VPC-02',
              type: 'vpc',
              attributes: { cidr: '10.2.0.0/16', encryption: 'KMS-HSM' },
              children: [
                { name: 'EKS Cluster "Prod-EU"', type: 'cluster', attributes: { version: '1.30', nodes: 12 } },
                { name: 'EU Read Replica Database', type: 'database', attributes: { replicationLagMs: 8 } },
              ],
            },
          ],
        },
      ],
    },
    typescriptDefinition: `export interface TopologyNode {
  name: string;
  type: 'root' | 'region' | 'vpc' | 'cluster' | 'database' | 'cache' | 'edge';
  attributes: Record<string, string | number | boolean>;
  children?: TopologyNode[];
}`,
    sampleRecords: [
      { resource: 'EKS Cluster Prod-Core', region: 'us-east-1', status: 'HEALTHY', cpuUtilization: '44.2%', memoryUtilization: '61.8%' },
      { resource: 'Aurora Postgres Multi-AZ', region: 'us-east-1', status: 'HEALTHY', connections: 248, readLatencyMs: 1.4 },
    ],
  },
];

export const STARTER_DATASETS: Dataset[] = [
  {
    id: 'ds_saas_metrics',
    name: 'Enterprise SaaS Revenue & Churn Cohorts',
    description: 'Monthly historical financial telemetry tracking recurring revenue, customer acquisition cost, retention, and payback periods.',
    category: 'Finance & Growth',
    columns: ['month', 'mrr', 'net_new_arr', 'churn_rate', 'nrr', 'cac', 'active_customers'],
    rows: [
      { month: '2026-01', mrr: 184500, net_new_arr: 28400, churn_rate: 0.82, nrr: 114.2, cac: 3840, active_customers: 612 },
      { month: '2026-02', mrr: 198200, net_new_arr: 31200, churn_rate: 0.74, nrr: 116.1, cac: 3720, active_customers: 648 },
      { month: '2026-03', mrr: 214800, net_new_arr: 36800, churn_rate: 0.69, nrr: 118.5, cac: 3610, active_customers: 692 },
      { month: '2026-04', mrr: 231500, net_new_arr: 39400, churn_rate: 0.71, nrr: 119.0, cac: 3550, active_customers: 734 },
      { month: '2026-05', mrr: 252000, net_new_arr: 44100, churn_rate: 0.65, nrr: 121.4, cac: 3480, active_customers: 785 },
      { month: '2026-06', mrr: 274600, net_new_arr: 48900, churn_rate: 0.62, nrr: 122.8, cac: 3410, active_customers: 840 },
      { month: '2026-07', mrr: 298400, net_new_arr: 52300, churn_rate: 0.58, nrr: 124.2, cac: 3340, active_customers: 898 },
      { month: '2026-08', mrr: 324100, net_new_arr: 57800, churn_rate: 0.55, nrr: 125.6, cac: 3290, active_customers: 962 },
      { month: '2026-09', mrr: 351200, net_new_arr: 62400, churn_rate: 0.51, nrr: 127.1, cac: 3210, active_customers: 1034 },
      { month: '2026-10', mrr: 382400, net_new_arr: 69500, churn_rate: 0.48, nrr: 128.9, cac: 3150, active_customers: 1115 },
    ],
    metrics: [
      { label: 'Current MRR', value: '$382,400', delta: '+8.9% MoM', trend: 'up', insight: 'On target to cross $400k next sprint' },
      { label: 'Annual Net Retention', value: '128.9%', delta: '+1.8% pts', trend: 'up', insight: 'Tier-1 enterprise expansion accelerating' },
      { label: 'Logo Churn Rate', value: '0.48%', delta: '-0.03% pts', trend: 'up', insight: 'Best in class benchmark (< 0.8%)' },
      { label: 'Blended CAC', value: '$3,150', delta: '-18.0% YoY', trend: 'up', insight: 'Inbound search and referral efficiency' },
    ],
    analysis: {
      summary: 'High-performing SaaS profile with compound MRR expansion of 107% year-to-date and expanding Net Retention (128.9%), indicating strong product-market fit in enterprise segments.',
      kpis: [
        { label: 'Annualized Run Rate (ARR)', value: '$4.59M', delta: '+107.2% YTD', trend: 'up', insight: 'Accelerating cohort expansion' },
        { label: 'Customer Payback Period', value: '5.2 mo', delta: '-1.4 mo', trend: 'up', insight: 'Healthy LTV:CAC ratio exceeding 6.8x' },
        { label: 'Net Expansion Revenue', value: '$48,200/mo', delta: '+22.4%', trend: 'up', insight: 'Seats and API add-ons driving growth' },
        { label: 'Active Enterprise Logos', value: '1,115', delta: '+82.1%', trend: 'up', insight: 'Zero mid-market logo losses in Q3' },
      ],
      anomalies: [
        {
          metric: 'April 2026 CAC Fluctuation',
          severity: 'low',
          description: 'Slight acquisition cost plateau due to experimental paid search campaign test',
          recommendedAction: 'Reallocate 30% of paid ad budget into high-intent organic technical whitepapers',
        },
      ],
      correlations: [
        {
          factorA: 'Active Customers Count',
          factorB: 'Net Retention Rate (NRR)',
          direction: 'positive',
          strength: '0.96',
          explanation: 'Larger organizations adopt multi-seat collaboration packages that systematically expand over time',
        },
        {
          factorA: 'Customer Acquisition Cost (CAC)',
          factorB: 'Churn Rate',
          direction: 'positive',
          strength: '0.91',
          explanation: 'Better qualified customer leads exhibit lower acquisition drag and markedly superior retention',
        },
      ],
      takeaways: [
        'Top 15% of enterprise accounts generate 62% of net new expansion ARR; prioritize dedicated technical account managers.',
        'NRR expansion trajectory suggests company can sustain >80% growth without increasing marketing headcount.',
        'Logo churn has declined monotonically from 0.82% to 0.48%, confirming stickiness of data automation features.',
      ],
      suggestedChart: {
        type: 'area',
        title: 'Monthly Recurring Revenue Growth (USD)',
        xDimension: 'month',
        yMetric: 'mrr',
      },
    },
  },
  {
    id: 'ds_cloud_telemetry',
    name: 'Distributed Cloud Microservices Telemetry',
    description: 'High-frequency telemetry logging requests/sec, p95 & p99 latency percentiles, error budgets, and cluster CPU saturation.',
    category: 'Cloud Engineering',
    columns: ['timestamp', 'throughput_rps', 'latency_p95_ms', 'latency_p99_ms', 'error_rate_pct', 'cpu_util_pct'],
    rows: [
      { timestamp: '00:00', throughput_rps: 14200, latency_p95_ms: 18.2, latency_p99_ms: 42.1, error_rate_pct: 0.012, cpu_util_pct: 38.2 },
      { timestamp: '02:00', throughput_rps: 11800, latency_p95_ms: 16.4, latency_p99_ms: 38.5, error_rate_pct: 0.009, cpu_util_pct: 32.4 },
      { timestamp: '04:00', throughput_rps: 10400, latency_p95_ms: 15.8, latency_p99_ms: 36.2, error_rate_pct: 0.008, cpu_util_pct: 29.8 },
      { timestamp: '06:00', throughput_rps: 16800, latency_p95_ms: 19.4, latency_p99_ms: 44.8, error_rate_pct: 0.015, cpu_util_pct: 44.1 },
      { timestamp: '08:00', throughput_rps: 28400, latency_p95_ms: 24.8, latency_p99_ms: 58.2, error_rate_pct: 0.024, cpu_util_pct: 61.5 },
      { timestamp: '10:00', throughput_rps: 36200, latency_p95_ms: 29.1, latency_p99_ms: 67.4, error_rate_pct: 0.038, cpu_util_pct: 74.2 },
      { timestamp: '12:00', throughput_rps: 42100, latency_p95_ms: 32.4, latency_p99_ms: 76.1, error_rate_pct: 0.042, cpu_util_pct: 82.6 },
      { timestamp: '14:00', throughput_rps: 40800, latency_p95_ms: 31.0, latency_p99_ms: 71.8, error_rate_pct: 0.039, cpu_util_pct: 79.4 },
      { timestamp: '16:00', throughput_rps: 37900, latency_p95_ms: 28.5, latency_p99_ms: 64.2, error_rate_pct: 0.031, cpu_util_pct: 71.0 },
      { timestamp: '18:00', throughput_rps: 31200, latency_p95_ms: 24.2, latency_p99_ms: 55.4, error_rate_pct: 0.022, cpu_util_pct: 63.8 },
      { timestamp: '20:00', throughput_rps: 24500, latency_p95_ms: 21.0, latency_p99_ms: 48.9, error_rate_pct: 0.018, cpu_util_pct: 52.1 },
      { timestamp: '22:00', throughput_rps: 18600, latency_p95_ms: 18.9, latency_p99_ms: 43.6, error_rate_pct: 0.014, cpu_util_pct: 42.0 },
    ],
    metrics: [
      { label: 'Peak Request Volume', value: '42,100 rps', delta: '+14.2% vs last cycle', trend: 'up', insight: 'Mid-day traffic spike absorbed without throttling' },
      { label: 'p99 Tail Latency', value: '76.1 ms', delta: '-12.4 ms', trend: 'up', insight: 'Down from 88.5ms prior to connection pooling' },
      { label: 'SLA Error Budget Burn', value: '0.042%', delta: '-0.008%', trend: 'up', insight: 'Safely within the 0.1% SLO budget' },
      { label: 'Compute Headroom', value: '17.4%', delta: '+5.0%', trend: 'up', insight: 'Autoscaler triggered 4 additional microvm replicas' },
    ],
    analysis: {
      summary: 'Service Mesh telemetry proves resilient scaling up to 42.1k req/sec peak loads with p99 tail latency held strictly below 80ms and error rates under 0.045%.',
      kpis: [
        { label: 'Average Daily Requests', value: '648M req', delta: '+22.0%', trend: 'up', insight: 'Daily ingress load' },
        { label: 'Mean p95 Latency', value: '23.4 ms', delta: '-4.1 ms', trend: 'up', insight: 'Core API latency' },
        { label: 'Peak CPU Utilization', value: '82.6%', delta: 'Target <= 85%', trend: 'neutral', insight: 'Cluster load' },
        { label: 'Availability Invariant', value: '99.98%', delta: 'Target 99.95%', trend: 'up', insight: 'SLA uptime' },
      ],
      anomalies: [
        {
          metric: '12:00 UTC CPU Elevation (82.6%)',
          severity: 'medium',
          description: 'CPU threshold crossed 80% during peak US-East and EU overlap window',
          recommendedAction: 'Lower Kubernetes HPA target threshold from 80% to 70% to trigger horizontal pod autoscaling 5 minutes earlier',
        },
      ],
      correlations: [
        {
          factorA: 'Throughput (RPS)',
          factorB: 'p99 Latency',
          direction: 'positive',
          strength: '0.94',
          explanation: 'Queue wait times in the thread pool expand under peak concurrency; connection reuse is key',
        },
      ],
      takeaways: [
        'Deploy pre-warmed pod pools prior to 11:30 UTC to prevent temporary CPU spikes.',
        'Redis cache hit ratio sustained at 96.8%, shielding Postgres primary from 90% of read volume.',
      ],
      suggestedChart: {
        type: 'bar',
        title: 'Throughput Across 24h Telemetry Window',
        xDimension: 'timestamp',
        yMetric: 'throughput_rps',
      },
    },
  },
];

export const STARTER_DRIVE_FILES: DriveFile[] = [
  {
    id: 'file_fc_01',
    name: 'Zero_Trust_Auth_Flowchart.json',
    path: '/Flowcharts',
    type: 'flowchart',
    sizeBytes: 14200,
    updatedAt: '2026-10-19T07:12:00Z',
    createdAt: '2026-10-18T14:30:00Z',
    tags: ['Security', 'Auth', 'Architecture', 'v2.1'],
    data: STARTER_FLOWCHARTS[0],
    summary: 'Interactive flowchart detailing zero-trust user authentication with FIDO2 passkey fallbacks and automated risk scoring.',
  },
  {
    id: 'file_fc_02',
    name: 'Order_Settlement_Pipeline.json',
    path: '/Flowcharts',
    type: 'flowchart',
    sizeBytes: 12800,
    updatedAt: '2026-10-19T06:45:00Z',
    createdAt: '2026-10-17T09:15:00Z',
    tags: ['E-Commerce', 'Kafka', 'Transactions'],
    data: STARTER_FLOWCHARTS[1],
    summary: 'Distributed transaction order settlement flowchart with distributed Redlock and transactional outbox write.',
  },
  {
    id: 'file_struct_01',
    name: 'Multi_Tenant_SaaS_Schema.sql',
    path: '/Schemas',
    type: 'structure',
    sizeBytes: 21400,
    updatedAt: '2026-10-19T05:20:00Z',
    createdAt: '2026-10-16T11:00:00Z',
    tags: ['PostgreSQL', 'Multi-Tenant', 'ERD', 'Production'],
    data: STARTER_STRUCTURES[0],
    summary: 'Relational database schema with 4 normalized tables, foreign keys, audit logs, and TypeScript interface exports.',
  },
  {
    id: 'file_struct_02',
    name: 'Delivery_State_Machine.json',
    path: '/Schemas',
    type: 'structure',
    sizeBytes: 9800,
    updatedAt: '2026-10-18T16:00:00Z',
    createdAt: '2026-10-17T12:00:00Z',
    tags: ['Automaton', 'Logistics', 'State Machine'],
    data: STARTER_STRUCTURES[1],
    summary: 'Finite state machine specification with 6 states and 6 guarded transitions for autonomous courier delivery.',
  },
  {
    id: 'file_struct_03',
    name: 'Cloud_Resource_Topology.json',
    path: '/Schemas',
    type: 'structure',
    sizeBytes: 16500,
    updatedAt: '2026-10-18T19:40:00Z',
    createdAt: '2026-10-18T18:00:00Z',
    tags: ['Tree', 'Infrastructure', 'Kubernetes'],
    data: STARTER_STRUCTURES[2],
    summary: 'Hierarchical tree model representing multi-region VPC and Kubernetes cluster infrastructure topologies.',
  },
  {
    id: 'file_ds_01',
    name: 'Enterprise_SaaS_Cohorts.csv',
    path: '/Datasets',
    type: 'dataset',
    sizeBytes: 42100,
    updatedAt: '2026-10-19T04:10:00Z',
    createdAt: '2026-10-15T08:00:00Z',
    tags: ['SaaS', 'Finance', 'MRR', 'Churn'],
    data: STARTER_DATASETS[0],
    summary: 'Historical monthly financial dataset tracking MRR ($382.4k), Net Retention (128.9%), and blended CAC.',
  },
  {
    id: 'file_ds_02',
    name: 'Cloud_Microservices_Telemetry.csv',
    path: '/Datasets',
    type: 'dataset',
    sizeBytes: 38900,
    updatedAt: '2026-10-19T06:50:00Z',
    createdAt: '2026-10-19T00:00:00Z',
    tags: ['Telemetry', 'DevOps', 'Latency', 'p99'],
    data: STARTER_DATASETS[1],
    summary: '24-hour service mesh telemetry logging requests/second, p95/p99 latency, and cluster CPU saturation.',
  },
  {
    id: 'file_report_01',
    name: 'Q3_Operational_Architecture_Audit.md',
    path: '/Reports',
    type: 'report',
    sizeBytes: 18400,
    updatedAt: '2026-10-19T07:05:00Z',
    createdAt: '2026-10-19T06:00:00Z',
    tags: ['Audit', 'Executive Summary', 'Q3-2026'],
    data: {
      title: 'Q3 Operational Architecture Audit & Readiness',
      summary: 'Comprehensive readiness audit across database integrity, zero-trust perimeter, and microservices latency budgets.',
      findings: [
        'Zero-trust authentication migration reduced brute-force credential stuffing attempts by 99.4%.',
        'Multi-tenant schema indexing on tenant_id achieved sub-4ms query resolution across 99.8% of tenant requests.',
        'SaaS Net Retention expansion of 128.9% reflects strong organic platform expansion.',
      ],
      recommendations: [
        'Enforce FIDO2 passkeys for all tenant owners by Q4.',
        'Stagger morning cron jobs across 15-minute intervals to eliminate 12:00 UTC CPU spikes.',
        'Archive audit logs older than 90 days to cold S3 Glacier storage tier.',
      ],
    },
    summary: 'Executive architecture audit report synthesizing flowchart performance, database schemas, and telemetry.',
  },
];
