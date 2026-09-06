#!/usr/bin/env bash
# First-time setup of a Temply host on a fresh Ubuntu 24.04 (ARM or x86) VM —
# written for Oracle Cloud's Always Free A1 shape, but nothing here is Oracle
# specific. Run once as the default `ubuntu` user:
#
#   REPO_URL=git@github.com:you/temply.git TEMPLY_HOST=app.example.com bash setup.sh
#
# TEMPLY_HOST is the public hostname Caddy will get a certificate for. With no
# domain yet, use the free wildcard DNS: <public-ip with dashes>.sslip.io,
# e.g. 129-146-1-2.sslip.io — the script defaults to that.
#
# What it does: installs Bun, Caddy and git; opens 80/443 in the VM's own
# firewall (Oracle images ship with everything but 22 rejected); clones the
# repo to /opt/temply; installs the two systemd services and the hourly
# backup; then stops so you can fill in the two .env files before `update.sh`
# builds and starts everything.
set -euo pipefail

REPO_URL="${REPO_URL:?set REPO_URL to the git address of this repository}"
BRANCH="${BRANCH:-main}"
PUBLIC_IP="$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)"
TEMPLY_HOST="${TEMPLY_HOST:-${PUBLIC_IP//./-}.sslip.io}"
APP_DIR=/opt/temply
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "== packages"
sudo apt-get update -q
sudo apt-get install -y -q git unzip curl debian-keyring debian-archive-keyring apt-transport-https

echo "== Bun"
if ! command -v bun >/dev/null; then
  curl -fsSL https://bun.sh/install | bash
fi
export PATH="$HOME/.bun/bin:$PATH"
bun --version

echo "== Caddy (HTTPS reverse proxy; certificates are automatic)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -q && sudo apt-get install -y -q caddy
fi

echo "== firewall: allow 80 and 443 (Oracle's image rejects everything but 22)"
for port in 80 443; do
  if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 5 -p tcp --dport "$port" -m state --state NEW -j ACCEPT
  fi
done
sudo netfilter-persistent save >/dev/null 2>&1 || sudo apt-get install -y -q iptables-persistent

echo "== repository → $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR" && sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
mkdir -p "$APP_DIR/server/backups"

echo "== services"
sudo install -m 644 "$HERE/temply-server.service" /etc/systemd/system/temply-server.service
sudo install -m 644 "$HERE/temply-client.service" /etc/systemd/system/temply-client.service
sudo sed -i "s|__USER__|$USER|g; s|__HOME__|$HOME|g" /etc/systemd/system/temply-*.service
sudo systemctl daemon-reload
sudo systemctl enable temply-server temply-client >/dev/null

echo "== Caddy site"
printf 'TEMPLY_HOST=%s\n' "$TEMPLY_HOST" | sudo tee /etc/caddy/temply.env >/dev/null
sudo install -m 644 "$HERE/Caddyfile" /etc/caddy/Caddyfile
sudo mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=/etc/caddy/temply.env\n' | sudo tee /etc/systemd/system/caddy.service.d/temply.conf >/dev/null
sudo systemctl daemon-reload
sudo systemctl restart caddy

echo "== hourly database snapshot"
( crontab -l 2>/dev/null | grep -v 'temply/server && ' ; echo "17 * * * * cd $APP_DIR/server && $HOME/.bun/bin/bun run db:backup >> $APP_DIR/server/backups/backup.log 2>&1" ) | crontab -

cat <<DONE

Host is ready at https://$TEMPLY_HOST (Caddy will fetch the certificate on first request).

Next:
  1. Fill in the two env files — every key in .env.example:
       nano $APP_DIR/client/.env
       nano $APP_DIR/server/.env
     with NEXT_PUBLIC_APP_URL=https://$TEMPLY_HOST in both.
  2. Build and start:
       bash $APP_DIR/deploy/oracle/update.sh
  3. Register the webhooks:
       Clerk   https://$TEMPLY_HOST/api/webhooks/clerk
       Stripe  https://$TEMPLY_HOST/api/webhooks/stripe
DONE
