# Adding Secured Databases

This guide covers how to add databases running in secured environments like AWS RDS, Azure Database, Google Cloud SQL, and Kubernetes pods.

## Table of Contents
- [Kubernetes Pod Databases](#kubernetes-pod-databases)
- [AWS RDS](#aws-rds)
- [Azure Database](#azure-database)
- [Google Cloud SQL](#google-cloud-sql)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Troubleshooting](#troubleshooting)

---

## Kubernetes Pod Databases

When ChronoStash is running inside a Kubernetes cluster, you can connect to databases running as pods using Kubernetes service names.

### Service Discovery

Use the fully qualified domain name (FQDN) format:

```
<service-name>.<namespace>.svc.cluster.local
```

**Examples:**

| Database | Service Name | Namespace | Host Field |
|----------|-------------|-----------|------------|
| PostgreSQL | `postgres` | `default` | `postgres.default.svc.cluster.local` |
| MySQL | `mysql-service` | `production` | `mysql-service.production.svc.cluster.local` |
| MongoDB | `mongo` | `databases` | `mongo.databases.svc.cluster.local` |

### Short Form

If the database is in the **same namespace** as ChronoStash, you can use the short form:

```
<service-name>
```

**Example:**
- Full: `postgres.default.svc.cluster.local`
- Short: `postgres` (if ChronoStash is also in `default` namespace)

### Configuration Example

```yaml
Name: Production PostgreSQL
Engine: PostgreSQL
Host: postgres.production.svc.cluster.local
Port: 5432
Username: postgres
Password: <from-secret>
Database: myapp
SSL Mode: PREFER
```

### Using Kubernetes Secrets

**Best Practice:** Store credentials in Kubernetes Secrets, not directly in ChronoStash.

1. Create a Secret:
```bash
kubectl create secret generic postgres-creds \
  --from-literal=username=postgres \
  --from-literal=password=your-secure-password \
  -n production
```

2. Reference the secret values when adding the database in ChronoStash UI.

### Network Policies

Ensure ChronoStash pod can reach the database:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-chronostash-to-postgres
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kubedb-system
    ports:
    - protocol: TCP
      port: 5432
```

---

## AWS RDS

### Prerequisites
- RDS instance must be accessible from the cluster
- Security group must allow inbound traffic
- For private RDS: VPC peering or VPN required

### Connection Details

**Example: PostgreSQL RDS**

```yaml
Name: Production RDS PostgreSQL
Engine: PostgreSQL
Host: mydb.abc123.us-east-1.rds.amazonaws.com
Port: 5432
Username: admin
Password: <master-password>
Database: production
SSL Mode: REQUIRE
```

**Example: MySQL RDS**

```yaml
Name: Production RDS MySQL
Engine: MySQL
Host: mydb.abc123.us-east-1.rds.amazonaws.com
Port: 3306
Username: admin
Password: <master-password>
Database: production
SSL Mode: REQUIRE
```

### SSL/TLS for RDS

AWS RDS requires SSL for secure connections. Current options:

- **DISABLE**: Not recommended for RDS
- **PREFER**: Attempts SSL, falls back to plain
- **REQUIRE**: Enforces SSL but doesn't verify certificate
- **VERIFY_CA**: ⚠️ Requires CA certificate (see limitations below)
- **VERIFY_FULL**: ⚠️ Requires CA certificate + hostname verification

### Security Group Configuration

Allow inbound traffic from your Kubernetes cluster:

```hcl
# Example Terraform
resource "aws_security_group_rule" "rds_from_k8s" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/16"]  # Your K8s VPC CIDR
  security_group_id = aws_security_group.rds.id
}
```

### IAM Authentication (Advanced)

⚠️ **Not currently supported** - requires database driver extensions.

Workaround: Use traditional username/password authentication.

---

## Azure Database

### Azure Database for PostgreSQL

```yaml
Name: Azure PostgreSQL
Engine: PostgreSQL
Host: myserver.postgres.database.azure.com
Port: 5432
Username: myadmin@myserver
Password: <password>
Database: mydb
SSL Mode: REQUIRE
```

**Important:** Azure requires the `@servername` suffix for usernames.

### Azure Database for MySQL

```yaml
Name: Azure MySQL
Engine: MySQL
Host: myserver.mysql.database.azure.com
Port: 3306
Username: myadmin@myserver
Password: <password>
Database: mydb
SSL Mode: REQUIRE
```

### Firewall Rules

Add your Kubernetes cluster's egress IP to Azure firewall rules:

```bash
az postgres server firewall-rule create \
  --resource-group myResourceGroup \
  --server myserver \
  --name AllowK8s \
  --start-ip-address 203.0.113.10 \
  --end-ip-address 203.0.113.10
```

---

## Google Cloud SQL

### Cloud SQL for PostgreSQL

```yaml
Name: Cloud SQL PostgreSQL
Engine: PostgreSQL
Host: 10.1.2.3  # Private IP
Port: 5432
Username: postgres
Password: <password>
Database: mydb
SSL Mode: REQUIRE
```

### Cloud SQL Proxy (Recommended)

For secure connections, use Cloud SQL Proxy as a sidecar:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubedb-with-cloudsql
spec:
  template:
    spec:
      containers:
      - name: kubedb
        image: kubedb-lite:latest
        # ... your config

      - name: cloud-sql-proxy
        image: gcr.io/cloudsql-docker/gce-proxy:latest
        command:
        - "/cloud_sql_proxy"
        - "-instances=myproject:us-central1:myinstance=tcp:5432"
        securityContext:
          runAsNonRoot: true
```

Then connect via `localhost:5432` in KubeDB.

---

## SSL/TLS Configuration

### Current SSL Modes

| Mode | Description | Certificate Required | Use Case |
|------|-------------|---------------------|----------|
| **DISABLE** | No encryption | No | Local dev only |
| **PREFER** | SSL if available | No | Default option |
| **REQUIRE** | Enforces SSL | No | Most RDS/cloud DBs |
| **VERIFY_CA** | Verifies CA cert | ⚠️ Yes | High security |
| **VERIFY_FULL** | Full verification | ⚠️ Yes | Highest security |

### Limitations

⚠️ **Current Implementation:**
- `VERIFY_CA` and `VERIFY_FULL` modes are **not fully functional**
- No UI to upload SSL certificates
- Certificate paths not stored in database schema

### Workaround for Certificate-Based SSL

**Option 1: Use REQUIRE mode**
- Enforces encryption without certificate verification
- Acceptable for most cloud providers with trusted networks

**Option 2: Manual Certificate Configuration** (Advanced)
1. Mount certificates into KubeDB pod via ConfigMap:
```bash
kubectl create configmap rds-ca-cert \
  --from-file=ca.pem=/path/to/rds-ca-2019-root.pem \
  -n kubedb-system
```

2. Mount in deployment:
```yaml
volumeMounts:
- name: rds-ca
  mountPath: /etc/ssl/certs/rds
volumes:
- name: rds-ca
  configMap:
    name: rds-ca-cert
```

3. ⚠️ Modify database engine code to use `/etc/ssl/certs/rds/ca.pem`

### Downloading CA Certificates

**AWS RDS:**
```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

**Azure:**
```bash
wget https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem
```

**Google Cloud SQL:**
```bash
gcloud sql ssl-certs describe server-ca \
  --instance=myinstance \
  --format="get(cert)" > server-ca.pem
```

---

## Troubleshooting

### Connection Refused

**Problem:** `Error: connect ECONNREFUSED`

**Solutions:**
1. Verify service/host is reachable:
```bash
kubectl run -i --tty debug --image=busybox --restart=Never -- sh
nslookup postgres.production.svc.cluster.local
telnet postgres.production.svc.cluster.local 5432
```

2. Check security groups/firewall rules
3. Verify database is running

### SSL Handshake Failed

**Problem:** `Error: SSL handshake failed`

**Solutions:**
1. Use `REQUIRE` instead of `VERIFY_CA`/`VERIFY_FULL`
2. Verify SSL is enabled on database server
3. Check certificate validity dates

### Authentication Failed

**Problem:** `Error: password authentication failed`

**Solutions:**
1. Verify username/password
2. For Azure: Include `@servername` in username
3. Check database allows connections from host
4. For RDS: Verify master user credentials

### Timeout

**Problem:** `Error: Connection timeout`

**Solutions:**
1. Increase network policy timeout
2. Check NAT gateway configuration
3. Verify DNS resolution
4. Use IP address instead of hostname to rule out DNS issues

### Certificate Verification Failed

**Problem:** `Error: certificate verify failed`

**Solutions:**
1. Switch to `REQUIRE` mode (encryption without verification)
2. Upload correct CA certificate (see workaround above)
3. Verify certificate chain is complete

---

## Best Practices

### Security
1. ✅ Use `REQUIRE` SSL mode for all cloud databases
2. ✅ Store credentials in Kubernetes Secrets, not in KubeDB UI
3. ✅ Use least-privilege database users
4. ✅ Enable network policies to restrict access
5. ✅ Rotate credentials regularly

### Kubernetes
1. ✅ Use FQDN for cross-namespace connections
2. ✅ Create dedicated service accounts
3. ✅ Use RBAC to limit access to secrets
4. ✅ Deploy KubeDB in dedicated namespace

### Cloud Databases
1. ✅ Use private endpoints when possible
2. ✅ Enable VPC peering for AWS RDS
3. ✅ Use Cloud SQL Proxy for GCP
4. ✅ Configure firewall rules with specific CIDR blocks
5. ✅ Enable automated backups on the database side too

---

## Future Enhancements

Planned features for better secured database support:

- [ ] SSL certificate upload UI
- [ ] Kubernetes Secret integration (auto-populate credentials)
- [ ] AWS IAM database authentication
- [ ] Azure AD authentication
- [ ] Google Cloud IAM authentication
- [ ] Connection string builder with validation
- [ ] SSH tunnel support for bastion hosts
- [ ] mTLS (mutual TLS) support

---

## Questions?

If you encounter issues not covered here:
1. Check database engine logs
2. Test connection using CLI tools (`psql`, `mysql`, `mongosh`)
3. Open an issue with connection details (redact credentials!)
