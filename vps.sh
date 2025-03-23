#!/bin/bash
# VPS Security Setup Script for Docker Environment

# Update and upgrade packages
echo "=== Updating system packages ==="
apt update && apt upgrade -y

# Install necessary security packages
echo "=== Installing security tools ==="
apt install -y ufw fail2ban unattended-upgrades apparmor

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
# Explicitly deny Prometheus and Node Exporter from external access
ufw deny 9090/tcp  # Prometheus
ufw deny 9100/tcp  # Node Exporter

# Enable UFW
echo "y" | ufw enable

# Configure Docker daemon with secure defaults
echo "=== Configuring Docker security ==="
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "icc": false,
  "userns-remap": "default",
  "no-new-privileges": true
}
EOF

# Restart Docker to apply changes
systemctl restart docker

# Set up automatic security updates
echo "=== Configuring automatic security updates ==="
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# Configure sysctl for better security
echo "=== Hardening system network settings ==="
cat >> /etc/sysctl.conf << EOF
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Block SYN attacks
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
EOF

# Apply sysctl changes
sysctl -p

# Configure Fail2ban for SSH (on host)
echo "=== Configuring brute force protection ==="
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600

# Protect Docker daemon API
[docker-daemon]
enabled = true
filter = docker-daemon
logpath = /var/log/syslog
maxretry = 3
bantime = 3600
EOF

# Create Docker daemon filter for fail2ban
cat > /etc/fail2ban/filter.d/docker-daemon.conf << EOF
[Definition]
failregex = rejected connection from ".*?" \(no such host certificate in client request\)
            AUDIT: .*? docker .* avc:  denied .*?
ignoreregex =
EOF

# Create a custom Docker logs jail for fail2ban
cat > /etc/fail2ban/filter.d/docker-logs.conf << EOF
[Definition]
failregex = ^.*"method":"(GET|POST|PUT|DELETE)","uri":".*","status":401.*$
            ^.*"method":"(GET|POST|PUT|DELETE)","uri":".*","status":403.*$
ignoreregex =
EOF

cat > /etc/fail2ban/jail.d/docker-logs.conf << EOF
[docker-logs]
enabled = true
filter = docker-logs
logpath = /var/lib/docker/containers/*/*.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Restart Fail2ban
systemctl restart fail2ban

echo "=== Security setup complete ==="
echo "Note: Host-based security is now configured. UFW and fail2ban are active."
echo "Run your docker-compose file now to complete the setup."