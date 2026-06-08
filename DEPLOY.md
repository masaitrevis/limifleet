# Deploying LCFMS

This guide covers deploying LCFMS to production. Choose your path based on your needs and budget.

## Option A: Vercel + Render (Recommended for Beginners)

Best for: Zero server management, free tier available, automatic SSL + CI/CD.

**Architecture:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │ ──── │   Render    │ ──── │  PostgreSQL │
│  (Frontend) │      │  (Backend)  │      │   (Render)  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                     ┌──────┘
                     ▼
               ┌─────────────┐
               │Redis (Render)│
               └─────────────┘
```

### Step 1: Deploy Backend on Render

1. Go to https://dashboard.render.com/blueprint
2. Click **New Blueprint Instance**
3. Connect your GitHub repo (`masaitrevis/limifleet`)
4. Render auto-detects `render.yaml` and sets up:
   - PostgreSQL database
   - Redis cache
   - Backend API service
5. After deployment, copy your **API URL** (e.g., `https://lcfms-api.onrender.com`)

### Step 2: Deploy Frontend on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo (`masaitrevis/limifleet`)
3. In the project settings, configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variables in Vercel Dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-api-url.onrender.com
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
   ```
5. Deploy! Vercel gives you a URL like `https://limifleet.vercel.app`

### Step 3: Connect Frontend → Backend

1. Go to Render Dashboard → your API service → Environment
2. Add `FRONTEND_URL` with your Vercel URL:
   ```
   FRONTEND_URL=https://limifleet.vercel.app,https://limifleet-git-main.vercel.app
   ```
   (comma-separated for multiple preview/production URLs)
3. Redeploy the API service on Render

### Step 4: Run Database Migrations

```bash
# Render has a web shell feature, or use:
render psql lcfms-postgres
# Then run: npx prisma migrate deploy
```

Or via Render CLI:
```bash
render ssh lcfms-api
cd apps/api
npx prisma migrate deploy
```

### Step 5: Seed Demo Data

```bash
render ssh lcfms-api
cd apps/api
npx prisma db seed
```

---

## Option B: Single VPS (Full Control)

Best for: Small fleets, low budget, full control.

**Requirements:**
- VPS with 2+ CPU, 4GB RAM, 40GB SSD
- Ubuntu 22.04 LTS
- Domain name (e.g., `lcfms.yourcompany.com`)

### Step 1: Provision a VPS

**Recommended providers:**
| Provider | Plan | Monthly Cost |
|----------|------|-------------|
| Hetzner CX21 | 2 vCPU, 4GB RAM | ~€6 |
| DigitalOcean Droplet | 2 vCPU, 4GB RAM | ~$24 |
| AWS Lightsail | 2 vCPU, 4GB RAM | ~$20 |
| Linode 4GB | 2 vCPU, 4GB RAM | ~$24 |

### Step 2: Point DNS

Create A records pointing to your VPS IP:
- `lcfms.yourcompany.com` → VPS IP
- `api.lcfms.yourcompany.com` → VPS IP
- `grafana.lcfms.yourcompany.com` → VPS IP (optional)

### Step 3: Install Docker on the VPS

```bash
# SSH into your server
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group (optional)
usermod -aG docker $USER

# Install docker-compose plugin
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 4: Clone and Configure

```bash
git clone https://github.com/yourusername/lcfms.git /opt/lcfms
cd /opt/lcfms

# Create production env file
cat > .env << 'EOF'
# Required
DB_PASSWORD=your-secure-random-password-here
JWT_SECRET=your-256-bit-secret-key-here-min-32-chars
REDIS_PASSWORD=another-secure-password
DOMAIN=lcfms.yourcompany.com
ACME_EMAIL=admin@yourcompany.com
GRAFANA_PASSWORD=your-grafana-admin-password

# Optional (for S3 uploads, maps, etc.)
MAPBOX_TOKEN=your-mapbox-token
S3_BUCKET=your-s3-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
EOF

# Secure the env file
chmod 600 .env
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 64
```

### Step 5: Build and Start

**Option A: Build locally (if you have the source)**
```bash
# Build images
cd infra/docker
docker compose -f docker-compose.prod.yml build

# Or pull pre-built images from GitHub Container Registry
# (see CI/CD section below for GitHub Actions setup)
```

**Option B: Pull pre-built images**
```bash
# Set your GitHub username
export GHCR_USER=yourusername

# Login to GitHub Container Registry (if private)
docker login ghcr.io -u $GHCR_USER --password-stdin << 'EOF'
your-github-token
EOF

# Pull and start
cd infra/docker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Step 6: Initialize Database

```bash
# Run migrations
docker exec -it lcfms-api npx prisma migrate deploy

# Seed initial data (optional)
docker exec -it lcfms-api npx prisma db seed
```

### Step 7: Verify

- Open `https://lcfms.yourcompany.com` — should see the login page
- Open `https://api.lcfms.yourcompany.com/health` — should return `{"status":"ok"}`
- Traefik handles SSL automatically via Let's Encrypt

### Step 8: Update / Re-deploy

```bash
cd /opt/lcfms/infra/docker

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Restart with zero-downtime
docker compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker exec lcfms-api npx prisma migrate deploy
```

---

## Option C: Managed Platform (Zero Infrastructure)

Best for: Teams who don't want to manage servers.

### Railway (Easiest)

1. Fork this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Railway auto-detects the Docker Compose and deploys everything
4. Add environment variables in Railway dashboard
5. Add custom domain

### Render

1. Create a **PostgreSQL** managed database on Render
2. Create a **Redis** managed instance on Render
3. Create a **Web Service** for the API:
   - Build command: `cd apps/api && npm install && npm run build`
   - Start command: `cd apps/api && npm start`
   - Environment variables: `DATABASE_URL`, `REDIS_HOST`, `JWT_SECRET`
4. Create a **Static Site** for the web frontend:
   - Build command: `cd apps/web && npm install && npm run build`
   - Publish directory: `apps/web/.next`
   - Environment: `NEXT_PUBLIC_API_URL` (pointing to the API service URL)

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (detects Dockerfile automatically)
cd apps/api
fly launch --name lcfms-api
fly secrets set DATABASE_URL=... JWT_SECRET=...

# Deploy
cd apps/web
fly launch --name lcfms-web
fly secrets set NEXT_PUBLIC_API_URL=https://lcfms-api.fly.dev
```

---

## Option D: AWS / GCP / Azure (Enterprise Scale)

Best for: Large fleets, high availability, compliance requirements.

### AWS Architecture
```
Route53 → CloudFront → ALB → ECS/Fargate (API/Web)
                    ↓
              RDS PostgreSQL (Multi-AZ)
              ElastiCache Redis
              S3 (file uploads)
```

**Deploy using Terraform:**
```bash
cd infra/terraform

# Create terraform.tfvars
cat > terraform.tfvars << 'EOF'
aws_region = "us-east-1"
db_password = "your-secure-password"
EOF

terraform init
terraform plan
terraform apply
```

Then deploy the container images to ECS or EKS using the Kubernetes manifests in `infra/k8s/`.

---

## Option E: Kubernetes (Self-Hosted or Managed)

For teams already running Kubernetes clusters.

```bash
# 1. Create namespace and secrets
kubectl apply -f infra/k8s/namespace.yaml

# 2. Set secrets
kubectl create secret generic lcfms-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  --from-literal=mapbox-token="..." \
  -n lcfms

# 3. Deploy
kubectl apply -f infra/k8s/deployment.yaml

# 4. Get ingress IP
kubectl get ingress -n lcfms
```

**Managed K8s options:**
- AWS EKS (~$75/month control plane)
- Google GKE (~$75/month control plane)
- Azure AKS (~$75/month)
- DigitalOcean Kubernetes (~$12/node)

---

## CI/CD with GitHub Actions

The repository includes `.github/workflows/deploy.yml` for automated deployment.

**Setup:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `DOCKER_USERNAME` / `DOCKER_PASSWORD` (or `GHCR_TOKEN`)
   - `VPS_HOST` (IP or domain)
   - `VPS_USER` (usually `root`)
   - `VPS_SSH_KEY` (private SSH key)
   - `ENV_FILE` (full `.env` contents)

3. Push to `main` branch — it auto-builds and deploys

---

## Backups

**Database (PostgreSQL):**
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * docker exec lcfms-postgres pg_dump -U lcfms lcfms > /backups/lcfms-$(date +\%Y\%m\%d).sql
```

**Volumes:**
```bash
# Backup all volumes
docker run --rm -v lcfms_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
docker run --rm -v lcfms_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

---

## Monitoring & Alerts

Included in production deployment:
- **Prometheus** at `https://prometheus.yourdomain.com`
- **Grafana** at `https://grafana.yourdomain.com` (default login: admin / your `GRAFANA_PASSWORD`)
- Pre-built dashboards for API metrics, DB performance, resource usage

**To set up alerts in Grafana:**
1. Add a notification channel (email, Slack, PagerDuty)
2. Import dashboard `1860` (Node Exporter) for server metrics
3. Set alert rules for high CPU, memory, or API error rates

---

## Troubleshooting

**SSL certificate not working?**
- Check DNS A records are pointing to the server
- Check `ACME_EMAIL` is set in `.env`
- View Traefik logs: `docker logs lcfms-traefik`

**Database connection errors?**
- Verify `DATABASE_URL` is correct
- Check postgres is healthy: `docker ps`
- View logs: `docker logs lcfms-postgres`

**Can't access the app?**
- Check firewall: `ufw allow 80/tcp && ufw allow 443/tcp`
- Check Traefik labels are correct in compose file
- Verify domain DNS propagation: `dig lcfms.yourcompany.com`

**Migrations failing?**
- Check if database is accessible: `docker exec lcfms-postgres pg_isready -U lcfms`
- Run manually: `docker exec lcfms-api npx prisma migrate deploy`
- View detailed logs: `docker exec lcfms-api npx prisma migrate deploy --verbose`

---

## Quick Reference

```bash
# View logs
docker logs -f lcfms-api
docker logs -f lcfms-web
docker logs -f lcfms-traefik

# Restart services
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart web

# Shell into containers
docker exec -it lcfms-api sh
docker exec -it lcfms-postgres psql -U lcfms

# Scale API (if load is high)
docker compose -f docker-compose.prod.yml up -d --scale api=3

# Full system status
docker compose -f docker-compose.prod.yml ps
docker stats
```
