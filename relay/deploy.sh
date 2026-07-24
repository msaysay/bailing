#!/bin/bash
# 百灵云服务中转 · 部署脚本（照 ssjf-deploy 模式）
# 用法：bash relay/deploy.sh   （需要 VPN 关闭，SSH 直连腾讯云）
set -e
cd "$(dirname "$0")"

KEY="D:/cd/ssjf-deploy/secrets/deploy_ed25519"
TARGET="root@159.75.115.84"
DEST="/var/www/bailing-relay"
OPT="-i $KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"

echo "== ① 推送 server.js =="
ssh $OPT $TARGET "mkdir -p $DEST/data"
scp $OPT server.js "$TARGET:$DEST/server.js"

echo "== ② 写入 systemd 服务（幂等）=="
ssh $OPT $TARGET "cat > /etc/systemd/system/bailing-relay.service" <<'EOF'
[Unit]
Description=Bailing Cloud Relay (MiMo proxy with daily quota)
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/bailing-relay
EnvironmentFile=/var/www/bailing-relay/secrets.env
ExecStart=/usr/bin/node /var/www/bailing-relay/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "== ③ 重启服务 + 探活 =="
ssh $OPT $TARGET "systemctl daemon-reload && systemctl enable --now bailing-relay && systemctl restart bailing-relay && sleep 2 && systemctl is-active bailing-relay && curl -s http://127.0.0.1:8350/health"
echo ""
echo "✅ 完成。注意：secrets.env 需已在服务器上（含 MIMO_API_KEY）， nginx /bailing-api/ 指向 127.0.0.1:8350"
