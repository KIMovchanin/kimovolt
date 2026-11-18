# Развёртывание на Oracle Cloud Always Free (ARM64) и SEO

## 1. Ресурсы Oracle Cloud Always Free (Ampere A1)

Актуальные бесплатные лимиты Oracle Cloud Infrastructure (OCI):
- Форма: `VM.Standard.A1.Flex` (Ampere Altra ARM64)
- Квота пула Always Free: **1 500 OCPU-часов** и **9 000 ГБ-часов** в месяц (эквивалент **2 OCPU и 12 GB RAM** 24/7) + до **200 GB Block Volume**.
- Рекомендация для стабильности: создайте Ubuntu 24.04 ARM64 VM (например, 2 OCPU, 12 GB RAM, 50 GB boot volume) в домашнем регионе. Учитывайте политику OCI по возврату неактивных инстансов (при <20% утилизации CPU, памяти и сети в течение 7 дней).

---

## 2. Подготовка сервера (SSH, Firewall, Пользователь)

1. В консоли OCI Security List / NSG откройте входящие порты TCP `22` (SSH), `80` (HTTP для ACME/редиректа) и `443` (HTTPS).
2. Подключитесь по SSH и создайте системного пользователя и директории:
```bash
sudo adduser --system --group --no-create-home kimovolt
sudo mkdir -p /opt/kimovolt-lab/{data,backups,deploy,frontend}
sudo chown -R kimovolt:kimovolt /opt/kimovolt-lab
```
3. Настройте UFW внутри Ubuntu:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 3. Сборка и доставка файлов с Windows

На локальной машине Windows выполните:
```powershell
.\scripts\build-linux-arm64.ps1
```

Загрузите артефакты на сервер по `scp`:
```powershell
scp dist\kimovolt-lab-linux-arm64 ubuntu@<VM_IP>:/tmp/
scp -r frontend\dist ubuntu@<VM_IP>:/tmp/frontend-dist
scp deploy\* ubuntu@<VM_IP>:/tmp/deploy/
```

На сервере разложите файлы и выдайте права:
```bash
sudo mv /tmp/kimovolt-lab-linux-arm64 /opt/kimovolt-lab/kimovolt-lab-linux-arm64
sudo chmod +x /opt/kimovolt-lab/kimovolt-lab-linux-arm64
sudo rm -rf /opt/kimovolt-lab/frontend/dist && sudo mv /tmp/frontend-dist /opt/kimovolt-lab/frontend/dist
sudo mv /tmp/deploy/* /opt/kimovolt-lab/deploy/
sudo chmod +x /opt/kimovolt-lab/deploy/*.sh
sudo chown -R kimovolt:kimovolt /opt/kimovolt-lab
```

---

## 4. Конфигурация `.env` и `systemd`

Создайте `/opt/kimovolt-lab/.env` (замените домен на ваш реальный):
```ini
PORT=8080
DB_PATH=/opt/kimovolt-lab/data/kimovolt.db
STATIC_DIR=/opt/kimovolt-lab/frontend/dist
COOKIE_SECURE=true
PUBLIC_ORIGIN=https://your-domain.example
```

Установите и запустите сервис:
```bash
sudo cp /opt/kimovolt-lab/deploy/kimovolt-lab.service /etc/systemd/system/kimovolt-lab.service
sudo systemctl daemon-reload
sudo systemctl enable --now kimovolt-lab
sudo systemctl status kimovolt-lab
```

---

## 5. Обратный прокси Caddy с автоматическим HTTPS

1. Направьте A-запись DNS вашего домена на публичный IP сервера Oracle VM.
2. Установите Caddy (официальный репозиторий для ARM64 Ubuntu):
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```
3. Скопируйте `deploy/Caddyfile` в `/etc/caddy/Caddyfile`, вписав реальный домен (и `KIMOVOLT_DOMAIN` в среде или напрямую в файл), затем:
```bash
sudo systemctl reload caddy
curl -fsS https://your-domain.example/api/v1/health
```

---

## 6. Резервное копирование SQLite и обновления

Добавьте ежедневный cron-бэкап от пользователя `kimovolt`:
```bash
sudo crontab -u kimovolt -e
# Ежедневно в 03:30 UTC
30 3 * * * /opt/kimovolt-lab/deploy/backup-sqlite.sh
```

Для обновления загрузите новый бинарник и `frontend/dist`, затем запустите:
```bash
/opt/kimovolt-lab/deploy/update.sh
```

---

## 7. Индексация (SEO) после выбора домена

- Бэкенд автоматически отдаёт `/robots.txt` и `/sitemap.xml` по `PUBLIC_ORIGIN`.
- Личные маршруты `/profile`, `/progress` и `/api/` закрыты от индексации (`Disallow` + `X-Robots-Tag: noindex`).
- После запуска публичного домена добавьте сайт в **Google Search Console**, подтвердите владение через DNS TXT-запись и отправьте `https://your-domain.example/sitemap.xml` (индексация зависит от качества и обхода, сама отправка sitemap её не гарантирует).
