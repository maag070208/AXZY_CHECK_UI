#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .deploy.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .deploy.env
  set +a
fi

: "${FTP_HOST:?Falta FTP_HOST en .deploy.env}"
: "${FTP_USER:?Falta FTP_USER en .deploy.env}"
: "${FTP_PASS:?Falta FTP_PASS en .deploy.env}"
FTP_PORT="${FTP_PORT:-21}"
FTP_DIR="${FTP_DIR:-.}"
SITE_URL="${SITE_URL:-https://barcerlona-residencial-checkapp-dev.axzy.dev}"

echo "==> Build de producción"
pnpm build:prod

# En este hosting el document root real es la raíz de la cuenta FTP
# (el panel muestra "public_html", pero el sitio sirve desde la raíz).
echo "==> Publicando dist/ en ftp://${FTP_HOST}:${FTP_PORT}/${FTP_DIR}"
lftp -u "$FTP_USER","$FTP_PASS" \
  -e "set net:timeout 20; set net:max-retries 2; set ftp:ssl-allow no; set ftp:passive-mode on; mirror -R --verbose=1 --parallel=4 dist/ ${FTP_DIR}/; bye" \
  "ftp://${FTP_HOST}:${FTP_PORT}"

echo "==> Verificando ${SITE_URL}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$SITE_URL")
echo "HTTP ${HTTP_CODE}"
if ! curl -s --max-time 20 "$SITE_URL" | grep -q "<title>CheckApp"; then
  echo "Advertencia: no encontré el index de CheckApp en ${SITE_URL}" >&2
  exit 1
fi

echo "OK: app publicada en ${SITE_URL}"
