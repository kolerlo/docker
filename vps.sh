#!/bin/bash
# Minimalist VPS Setup Script with proper UFW settings and SYN attack protection

# Update packages (keeping just the basics)
echo "=== Updating system packages ==="
apt update

# Install only the required packages
echo "=== Installing minimal tools ==="
apt install -y ufw fail2ban

# Configure UFW with RESTORED proper rules
echo "=== Setting up firewall with secure defaults ==="
ufw default deny incoming  # RESTORED: Deny all incoming traffic by default
ufw default allow outgoing

# Allow only specific ports
ufw allow ssh
ufw allow 22/tcp
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # Grafana
ufw allow 5000/tcp  # Backend API
# RESTORED: Explicitly deny monitoring ports from external access
ufw deny 9090/tcp  # Prometheus
ufw deny 9100/tcp  # Node Exporter

# Enable UFW
echo "y" | ufw enable

# Create minimal Docker config
echo "=== Basic Docker configuration ==="
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m"
  },
  "icc": true
}
EOF

# Restart Docker
systemctl restart docker

# RESTORED: Configure sysctl for SYN attack protection
echo "=== Adding SYN attack protection ==="
cat >> /etc/sysctl.conf << EOF
# Block SYN attacks
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
EOF

# Apply sysctl changes
sysctl -p

# Basic Fail2ban config - just for SSH
echo "=== Minimal brute force protection ==="
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 10  # Higher threshold
bantime = 600  # Shorter ban time
EOF

# Restart Fail2ban
systemctl restart fail2ban

echo "=== Basic setup complete ==="
echo "Warning: System is configured with minimal security measures, but has proper firewall rules and SYN attack protection."