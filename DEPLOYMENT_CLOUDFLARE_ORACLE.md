# Flora Deployment Guide

This guide deploys Flora using:

- Frontend: Cloudflare Pages
- Backend: Oracle Cloud Always Free Ubuntu VM

This is the best practical free-forever setup for this project because:

- the React frontend is a static site and fits Cloudflare Pages well
- the FastAPI backend needs a long-running Python server, which is better suited to an Always Free VM

Project paths used in this guide:

- frontend: `Flora App/frontend`
- backend: `backend`

## 1. Prerequisites

The developer needs:

- GitHub repo access
- Cloudflare account
- Oracle Cloud account
- local SSH key pair for VM access

Recommended production URLs:

- frontend: `https://flora-app.pages.dev`
- backend: `https://api.yourdomain.com` or `http://<oracle-public-ip>:8000`

Using a domain for the backend is better, but this guide works with the VM public IP too.

## 2. Deploy Frontend to Cloudflare Pages

### 2.1 Create the Pages project

1. Push the repo to GitHub.
2. Log in to Cloudflare.
3. Open `Workers & Pages`.
4. Click `Create application`.
5. Choose `Pages`.
6. Choose `Connect to Git`.
7. Select the Flora repository.

### 2.2 Use these exact build settings

- Framework preset: `Create React App`
- Root directory: `Flora App/frontend`
- Build command: `npm install && npm run build`
- Build output directory: `build`
- Node.js version: `18` or higher

### 2.3 Add frontend environment variable

In Cloudflare Pages project settings, add:

- `REACT_APP_API_URL`

Set it to the public backend URL, for example:

```text
http://<ORACLE_PUBLIC_IP>:8000
```

or, if using a domain:

```text
https://api.yourdomain.com
```

### 2.4 Deploy

Click `Save and Deploy`.

After deploy, Cloudflare gives a URL like:

```text
https://flora-app.pages.dev
```

Save this URL because the backend must allow it in CORS.

## 3. Create the Oracle Cloud VM

### 3.1 Create the instance

1. Log in to Oracle Cloud.
2. Open `Compute` -> `Instances`.
3. Click `Create instance`.
4. Use:
   - Image: `Ubuntu 22.04`
   - Shape: an `Always Free` eligible shape
5. Add your SSH public key during setup.
6. Create the instance.

### 3.2 Open required ports

In Oracle networking/security settings, allow inbound traffic for:

- `22` for SSH
- `8000` if you want direct backend access without nginx/TLS
- `80` for HTTP if using nginx
- `443` for HTTPS if using nginx + SSL

If using Ubuntu firewall too, run:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000
sudo ufw enable
```

## 4. SSH into the VM

From your local machine:

```bash
ssh ubuntu@<ORACLE_PUBLIC_IP>
```

Replace `<ORACLE_PUBLIC_IP>` with your instance public IP.

## 5. Install System Packages on the VM

Run:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git nginx
```

## 6. Clone the Project on the VM

Choose a location and clone:

```bash
cd /home/ubuntu
git clone https://github.com/<owner>/<repo>.git flora-app
cd flora-app
```

## 7. Set Up the Backend

### 7.1 Create virtual environment

```bash
cd /home/ubuntu/flora-app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 7.2 Create backend environment file

Create:

```bash
nano /home/ubuntu/flora-app/backend/.env
```

Put this inside:

```env
ALLOWED_ORIGINS=https://flora-app.pages.dev
DB_FILE=/home/ubuntu/flora-app/backend/flora_db.json
```

If the Pages URL is different, use that exact URL instead.

Important:

- if you later add a custom frontend domain, include that too
- multiple origins can be comma-separated

Example:

```env
ALLOWED_ORIGINS=https://flora-app.pages.dev,https://flora.yourdomain.com
DB_FILE=/home/ubuntu/flora-app/backend/flora_db.json
```

### 7.3 Test the backend manually first

Run:

```bash
cd /home/ubuntu/flora-app/backend
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Then from your browser:

```text
http://<ORACLE_PUBLIC_IP>:8000/
http://<ORACLE_PUBLIC_IP>:8000/docs
```

If both open, the backend is working.

Press `Ctrl+C` after testing.

## 8. Run Backend as a Service with systemd

Create the service file:

```bash
sudo nano /etc/systemd/system/flora-api.service
```

Paste:

```ini
[Unit]
Description=Flora FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/flora-app/backend
EnvironmentFile=/home/ubuntu/flora-app/backend/.env
ExecStart=/home/ubuntu/flora-app/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flora-api
sudo systemctl start flora-api
sudo systemctl status flora-api
```

Useful commands later:

```bash
sudo systemctl restart flora-api
sudo systemctl stop flora-api
journalctl -u flora-api -f
```

## 9. Optional but Recommended: Put nginx in Front of FastAPI

This gives cleaner routing and prepares for using a custom domain and SSL.

### 9.1 Create nginx site config

```bash
sudo nano /etc/nginx/sites-available/flora-api
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/flora-api /etc/nginx/sites-enabled/flora-api
sudo nginx -t
sudo systemctl restart nginx
```

Now the backend should also respond at:

```text
http://<ORACLE_PUBLIC_IP>/
http://<ORACLE_PUBLIC_IP>/docs
```

If you use nginx on port `80`, update `REACT_APP_API_URL` in Cloudflare Pages to:

```text
http://<ORACLE_PUBLIC_IP>
```

Then redeploy the frontend.

## 10. Update Frontend If Backend URL Changes

If backend moves from `:8000` to plain `80` or a domain:

1. Go to Cloudflare Pages settings.
2. Update:

```text
REACT_APP_API_URL=http://<ORACLE_PUBLIC_IP>
```

or

```text
REACT_APP_API_URL=https://api.yourdomain.com
```

3. Trigger a redeploy.

## 11. Verify the Full Deployment

### Backend checks

Open:

```text
http://<ORACLE_PUBLIC_IP>/
http://<ORACLE_PUBLIC_IP>/docs
```

Expected:

- `/` returns JSON
- `/docs` opens FastAPI Swagger docs

### Frontend checks

Open the Cloudflare Pages URL and test:

1. app loads
2. sign in / create account works
3. quiz works
4. assessment submits
5. Home analysis loads
6. Food log works
7. guest-to-account sync works

### Browser checks

Open browser devtools and confirm:

- no CORS errors
- no `Failed to fetch`
- API calls go to the Oracle backend URL

## 12. Updating the App Later

When code changes:

### Frontend

- push to GitHub
- Cloudflare Pages auto-builds

### Backend

SSH into VM:

```bash
cd /home/ubuntu/flora-app
git pull
cd backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart flora-api
```

If static env values changed:

```bash
sudo systemctl restart nginx
```

## 13. Important Limitations

Current backend storage uses:

- `flora_db.json`
- `history.db`

This is acceptable for demos and academic submission, but not ideal for production-scale durability.

If the developer wants a more robust production setup later, migrate storage to Postgres.

## 14. Exact Summary for Developer

Use this exact deployment split:

- Cloudflare Pages
  - Root directory: `Flora App/frontend`
  - Build command: `npm install && npm run build`
  - Output directory: `build`
  - Env var: `REACT_APP_API_URL=http://<ORACLE_PUBLIC_IP>` or your backend domain

- Oracle VM
  - Ubuntu 22.04
  - install: `python3 python3-venv python3-pip git nginx`
  - backend path: `/home/ubuntu/flora-app/backend`
  - service: `flora-api.service`
  - backend start command:

```bash
/home/ubuntu/flora-app/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

## 15. Handy Command Block

Backend setup quick copy:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git nginx
cd /home/ubuntu
git clone https://github.com/<owner>/<repo>.git flora-app
cd /home/ubuntu/flora-app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Service quick copy:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flora-api
sudo systemctl start flora-api
sudo systemctl status flora-api
```

