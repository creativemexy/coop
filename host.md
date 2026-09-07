# Hosting Coop BNPL on an Oracle Cloud VPS

This guide deploys the Coop BNPL API and web console to an Oracle Cloud Infrastructure (OCI) Compute VPS running Ubuntu. It uses:

- **Nginx** for the web console, reverse proxy, and HTTPS
- **NestJS** for the backend API
- **PostgreSQL** for application data
- **systemd** to keep the backend running and restart it after reboots
- **Certbot** for a free Let's Encrypt TLS certificate

The mobile app is built separately and points to the public API URL.

## Deployment Layout

```text
Internet
  |
  | HTTPS :443 / HTTP :80
  v
Nginx
  |-- /              -> /var/www/coop/web/dist
  |-- /api/          -> http://127.0.0.1:3001/api/
  `-- /uploads/      -> http://127.0.0.1:3001/uploads/

NestJS API :3001 -> PostgreSQL :5432
```

Only ports `22`, `80`, and `443` should be public. PostgreSQL and the NestJS port stay private on the VPS.

## Before You Start

You need:

- An Oracle Cloud account with an Ubuntu 22.04 or 24.04 Compute instance
- A public IPv4 address for the instance
- A domain name, for example `coop.example.com`
- A DNS record pointing the domain to the VPS public IP
- Access to the GitHub repository
- Production credentials for payment, KYC, SMS, email, and other providers

The commands below assume:

```text
Domain: coop.example.com
Repository path: /var/www/coop
Linux user: coop
Backend port: 3001
```

Replace these values with your own values before running the commands.

## 1. Create the Oracle VPS

In the OCI Console:

1. Open **Compute > Instances** and select **Create instance**.
2. Choose Ubuntu 22.04 or 24.04.
3. Select an Ampere ARM shape or an AMD shape appropriate for your workload. Confirm that all native dependencies used by the application support the selected architecture.
4. Assign a public IPv4 address.
5. Add your SSH public key during instance creation.
6. Create the instance and record its public IP address.

### Configure OCI ingress rules

In the instance's subnet security list or Network Security Group, add ingress rules for:

| Protocol | Port | Source | Purpose |
| --- | ---: | --- | --- |
| TCP | 22 | Your office/home IP if possible | SSH administration |
| TCP | 80 | `0.0.0.0/0` | HTTP and Let's Encrypt validation |
| TCP | 443 | `0.0.0.0/0` | HTTPS application traffic |

Do not add public ingress rules for ports `3001` or `5432`.

## 2. Point DNS to the VPS

At your DNS provider, create:

```text
Type: A
Name: coop
Value: YOUR_ORACLE_PUBLIC_IP
TTL: 300
```

Wait for DNS to resolve before requesting the TLS certificate:

```bash
dig +short coop.example.com
```

The command should return the VPS public IP.

## 3. Connect and Update Ubuntu

From your computer, connect with the Ubuntu user created by OCI:

```bash
ssh ubuntu@YOUR_ORACLE_PUBLIC_IP
```

Update the server and install base packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates build-essential nginx postgresql postgresql-contrib ufw certbot python3-certbot-nginx
```

Set the server timezone if needed:

```bash
sudo timedatectl set-timezone Africa/Lagos
```

## 4. Configure the Firewall

OCI network rules and the VPS firewall both need to allow web traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status verbose
```

If SSH uses a custom port, allow that port before enabling UFW or you may lock yourself out.

## 5. Create a Dedicated Application User

Do not run the application as `root`:

```bash
sudo adduser --disabled-password --gecos '' coop
sudo usermod -aG www-data coop
sudo mkdir -p /var/www
sudo chown -R coop:coop /var/www
```

Switch to the application user:

```bash
sudo -iu coop
```

## 6. Install Node.js

Install Node.js 20 LTS with `nvm` for the `coop` user:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
node --version
npm --version
```

The backend, web, and mobile packages must be installed separately because this repository has three package roots.

## 7. Configure PostgreSQL

Switch back to an administrative shell:

```bash
exit
```

Create a database user and database. Use a strong password in place of the example value:

```bash
sudo -u postgres psql
```

Run the following SQL in the PostgreSQL prompt:

```sql
CREATE USER coop_app WITH PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
CREATE DATABASE coop_bnpl OWNER coop_app;
REVOKE ALL ON DATABASE coop_bnpl FROM PUBLIC;
GRANT ALL PRIVILEGES ON DATABASE coop_bnpl TO coop_app;
\connect coop_bnpl
GRANT ALL ON SCHEMA public TO coop_app;
\q
```

Verify local access:

```bash
sudo -u postgres psql -d coop_bnpl -c '\dt'
```

PostgreSQL should remain bound to localhost unless a separate private network setup requires otherwise. Do not expose port `5432` to the public internet.

## 8. Clone the Repository

The following example uses an SSH deploy key. Add a read-only deploy key to GitHub first if the repository is private.

```bash
sudo -iu coop
git clone git@github.com:creativemexy/coop.git /var/www/coop
cd /var/www/coop
```

If the repository is public, HTTPS cloning also works:

```bash
git clone https://github.com/creativemexy/coop.git /var/www/coop
```

## 9. Install Dependencies and Build

Install and build the backend:

```bash
cd /var/www/coop/backend
npm ci
npm run build
```

Install and build the web console:

```bash
cd /var/www/coop/web
npm ci
npm run build
```

The web build must produce `/var/www/coop/web/dist`.

The mobile project is not served by Nginx. Install its dependencies and build it on a development or CI machine when preparing an Android or iOS release:

```bash
cd /var/www/coop/mobile
npm ci
```

## 10. Create the Production Backend Environment

Create the backend environment file on the VPS:

```bash
sudo -iu coop
cp /var/www/coop/backend/.env.example /var/www/coop/backend/.env
chmod 600 /var/www/coop/backend/.env
nano /var/www/coop/backend/.env
```

At minimum, replace the database, encryption, JWT, CORS, and provider values:

```dotenv
NODE_ENV=production
PORT=3001
APP_PORT=3001
APP_ENV=production

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=coop_app
DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD
DB_NAME=coop_bnpl
DB_SYNCHRONIZE=false
DB_LOGGING=false

CORS_ORIGINS=https://coop.example.com
FRONTEND_URL=https://coop.example.com

ENCRYPTION_KEY=REPLACE_WITH_A_RANDOM_VALUE_AT_LEAST_32_CHARACTERS
JWT_ACCESS_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_A_DIFFERENT_LONG_RANDOM_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

PAYSTACK_SECRET_KEY=REPLACE_WITH_PRODUCTION_SECRET
PAYSTACK_PUBLIC_KEY=REPLACE_WITH_PRODUCTION_PUBLIC_KEY
KORAPAY_SECRET_KEY=REPLACE_WITH_PRODUCTION_SECRET
KORAPAY_PUBLIC_KEY=REPLACE_WITH_PRODUCTION_PUBLIC_KEY
TERMII_API_KEY=REPLACE_WITH_PRODUCTION_API_KEY
TERMII_SENDER_ID=CoopBNPL
```

Add the SMTP, retention, fee distribution, Sentry, and First Virtual configuration required by your deployment. The full variable list is in [backend/.env.example](backend/.env.example).

Generate strong values instead of using the development defaults:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Never commit this file or paste production secrets into GitHub issues, logs, or chat.

## 11. Initialize the Database

The application currently reads `DB_SYNCHRONIZE` from the environment. Keep it disabled in production. Before the first launch, apply the repository's reviewed migrations if your deployment process uses them, or use the project's approved database initialization procedure.

For a new non-production installation only, the seed command can create development data:

```bash
cd /var/www/coop/backend
npm run seed
```

Do not run development seed data against a production database unless you have reviewed the seed script and explicitly intend to create those accounts and records.

## 12. Create a systemd Service for the API

As an administrative user, create the service:

```bash
sudo nano /etc/systemd/system/coop-backend.service
```

Use this configuration:

```ini
[Unit]
Description=Coop BNPL NestJS API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=coop
Group=coop
WorkingDirectory=/var/www/coop/backend
Environment=NODE_ENV=production
Environment=PATH=/home/coop/.nvm/versions/node/v20.*/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
ExecStart=/home/coop/.nvm/versions/node/v20.*/bin/node /var/www/coop/backend/dist/main.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Because systemd does not expand the `*` wildcard in `ExecStart`, replace both `v20.*` paths with the exact directory returned by:

```bash
sudo -iu coop bash -lc 'dirname "$(readlink -f "$(which node)")"'
```

For example, the final paths may look like `/home/coop/.nvm/versions/node/v20.19.0/bin`.

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now coop-backend
sudo systemctl status coop-backend
```

View live API logs:

```bash
sudo journalctl -u coop-backend -f
```

Test the local API before configuring Nginx:

```bash
curl -i http://127.0.0.1:3001/
```

A `404` response is acceptable if the root route is not defined. A connection failure means the service is not running or is listening on a different port.

## 13. Configure Nginx

Create a site configuration:

```bash
sudo nano /etc/nginx/sites-available/coop
```

Use the following configuration and replace `coop.example.com`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name coop.example.com;

    root /var/www/coop/web/dist;
    index index.html;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and remove the default site:

```bash
sudo ln -s /etc/nginx/sites-available/coop /etc/nginx/sites-enabled/coop
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The `try_files` fallback is required for React Router routes such as `/login` and `/dashboard`.

## 14. Enable HTTPS

After DNS points to the VPS and Nginx responds on port 80:

```bash
sudo certbot --nginx -d coop.example.com
```

Choose the option to redirect HTTP to HTTPS. Verify automatic renewal:

```bash
sudo certbot renew --dry-run
```

Check the site:

```bash
curl -I https://coop.example.com
curl -I https://coop.example.com/api/v1/health
```

If the health route differs in this application, use the health endpoint registered in `backend/src/common/health`.

## 15. Configure the Mobile App

The mobile app reads `EXPO_PUBLIC_API_URL` from `mobile/app.config.js`. Set it to the HTTPS API origin before building the app:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://coop.example.com npm start
```

For EAS builds, configure the variable in the EAS project or provide it through the build profile environment. The value must not use `localhost` in a released mobile app.

If SSL pinning is enabled, configure `EXPO_PUBLIC_ENABLE_SSL_PINNING=true` and provide the correct certificate hashes only after the production certificate and renewal process have been finalized.

## 16. Verify the Deployment

Run these checks from the VPS:

```bash
sudo systemctl is-active postgresql
sudo systemctl is-active coop-backend
sudo systemctl is-active nginx
curl -fsS http://127.0.0.1:3001/ || true
curl -fsS https://coop.example.com/ >/dev/null
curl -fsS https://coop.example.com/api/v1/health
```

Run these checks from another network:

```bash
curl -I https://coop.example.com
nc -vz coop.example.com 443
```

Then test in a browser:

1. Open the web console.
2. Register or log in with an approved account.
3. Confirm that authenticated API requests succeed.
4. Confirm that uploaded branding or catalog files load through `/uploads/`.
5. Confirm the mobile app can log in using the HTTPS API URL.
6. Confirm payment-provider webhook URLs use HTTPS and match the configured production domain.

## 17. Future Updates

Create a deployment script or run the following carefully as the `coop` user:

```bash
cd /var/www/coop
git pull --ff-only origin main

cd backend
npm ci
npm run build

cd ../web
npm ci
npm run build
```

Restart the API and reload Nginx as an administrator:

```bash
sudo systemctl restart coop-backend
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status coop-backend --no-pager
```

Check logs after every deployment:

```bash
sudo journalctl -u coop-backend -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

For zero-downtime deployments, use a CI/CD pipeline and a process manager strategy designed for multiple API instances instead of restarting the only instance manually.

## 18. Backups and Operations

At minimum:

- Enable OCI volume backups or snapshots.
- Schedule encrypted PostgreSQL backups outside the VPS.
- Test restoring a backup on a separate database.
- Monitor disk usage, memory, CPU, HTTPS expiry, API health, and PostgreSQL availability.
- Keep the OS, Node.js, PostgreSQL, and application dependencies patched.
- Rotate secrets and provider credentials according to your security policy.
- Restrict SSH to trusted IP addresses and use SSH keys instead of passwords.
- Do not expose PostgreSQL, Redis, or the NestJS port publicly.

Example logical PostgreSQL backup:

```bash
sudo -u postgres pg_dump -Fc coop_bnpl > /var/backups/coop_bnpl-$(date +%F).dump
```

Store backups on separate infrastructure. A backup kept only on the same VPS does not protect against disk or instance loss.

## Troubleshooting

### API service will not start

```bash
sudo systemctl status coop-backend
sudo journalctl -u coop-backend -n 200 --no-pager
```

Check the `.env` permissions, database credentials, Node path in the systemd unit, and that `backend/dist/main.js` exists.

### Nginx returns 502 Bad Gateway

The API is unavailable or Nginx is proxying to the wrong port:

```bash
sudo systemctl status coop-backend
curl -i http://127.0.0.1:3001/
sudo nginx -t
```

### Browser shows CORS errors

Set `CORS_ORIGINS` to the exact HTTPS web origin, without a trailing slash, then restart the API:

```dotenv
CORS_ORIGINS=https://coop.example.com
```

### Frontend routes return 404 after refresh

Confirm the Nginx `location /` block contains:

```nginx
try_files $uri $uri/ /index.html;
```

### Mobile app cannot connect

Confirm the app was built with `EXPO_PUBLIC_API_URL=https://coop.example.com`, the domain has a valid certificate, and port 443 is allowed in both OCI and UFW.
