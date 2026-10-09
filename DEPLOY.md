# Deployment

**Pushing to `main` on GitHub IS deploying. Do not copy files to the server by hand.**

The production server pulls from GitHub on a schedule and mirrors `main` exactly.
Anything placed on the server out-of-band is erased at the next run, usually within
the hour.

## How it works

Server: `root@64.227.152.7` (DigitalOcean, blr1). Its private address is `10.122.0.3`.

| Cron | Script | What it does |
|---|---|---|
| `0 * * * *` | `/root/update-backend.sh` | Deploys `turaco-backend` |
| `5 * * * *` | `/root/update-website.sh` | Deploys this repo |

The backend runs first so the API is never older than the site calling it.

Each script:

1. `git fetch`, and **exits silently if `main` has not moved** (no log spam, no alert)
2. `git reset --hard origin/main` — the server is a pure mirror, so local drift
   can never accumulate (the server's Go rewrites `go.mod` on every build)
3. Deploys: `rsync -a --delete` into `/var/www/html`, or build + `systemctl restart`
4. Verifies: the site must answer, or the backend's `/api/health` must return 200
5. **Backend only:** rolls back to the previous binary if the health check fails
6. Sends a Telegram message on success, and on any failure

Logs: `/var/log/turaco-website-update.log`, `/var/log/turaco-update.log`

## Deploying

```bash
git push origin main      # wait up to an hour
```

To deploy immediately:

```bash
ssh root@64.227.152.7 /root/update-backend.sh
ssh root@64.227.152.7 /root/update-website.sh
```

## What is NOT deployed

`rsync --delete` mirrors the repo into the webroot, minus: `.git`, `design/`,
`devserver.py`, `TESTING.md`, `DEPLOY.md`, `README.md`, `.gitignore`.

Nothing else may live in `/var/www/html` — it will be deleted.

## Infrastructure

- nginx 1.24 serves `/var/www/html` and proxies `location /api/` to `127.0.0.1:8080`
- TLS via Let's Encrypt (certbot), HTTP redirects to HTTPS
- `turaco-backend.service` (systemd), env from `/root/turaco-backend/.env`
- PostgreSQL 16, database `turacodb`
- Backups: `/root/backups/<timestamp>/`

## Local development

```bash
python3 devserver.py --port 3000      # serves the site AND proxies /api to :8080
```

Do not use `python3 -m http.server` — it answers 501 to every POST, which makes
the contact and booking forms look broken.
