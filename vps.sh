#!/bin/bash
# VPS Security Setup Script for Docker Environment

# Update and upgrade packages
echo "=== Updating system packages ==="
apt update && apt upgrade -y

# Install necessary security packages
echo "=== Installing security tools ==="
apt install -y ufw fail2ban unattended-upgrades

# Configure UFW (Uncomplicated Firewall)
echo "=== Configuring firewall ==="
ufw default deny incoming
ufw default allow outgoing

# Allow SSH and web traffic
ufw allow ssh
ufw allow 22/tcp
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # Grafana
ufw allow 5000/tcp  # Backend API
# ufw allow 9090/tcp  # Prometheus (Consider not exposing externally)
# ufw allow 9100/tcp  # Node Exporter (Consider not exposing externally)

# Enable UFW
echo "y" | ufw enable

# Configure Fail2ban
echo "=== Configuring brute force protection ==="
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOF

# Restart Fail2ban
systemctl restart fail2ban