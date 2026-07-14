#!/bin/bash
set -e

DB_NAME="demo"
ADMIN_PASSWORD="admin"
DEMO_USER_LOGIN="demo"
DEMO_USER_PASSWORD="demo"
API_KEY_NAME="rn-odoo-example"
API_KEY_FILE="/var/lib/odoo/.rn-odoo-api-key"
INIT_MARKER="/var/lib/odoo/.init-done"

wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL..."
  for i in $(seq 1 60); do
    if PGPASSWORD=odoo pg_isready -h db -p 5432 -U odoo > /dev/null 2>&1; then
      echo "✅ PostgreSQL is ready"
      return 0
    fi
    sleep 2
  done
  echo "❌ PostgreSQL did not become ready in time"
  return 1
}

database_exists() {
  PGPASSWORD=odoo psql -h db -p 5432 -U odoo -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"
}

setup_demo_user_and_key() {
  echo "🔑 Setting up demo user and API key..."

  odoo shell --config /etc/odoo/odoo.conf --database "$DB_NAME" --no-http << PYEOF
import os

from datetime import datetime, timedelta

env = self.env
User = env['res.users']
ApiKey = env['res.users.apikeys']

# Create or update demo user
demo_user = User.search([('login', '=', '$DEMO_USER_LOGIN')], limit=1)
if not demo_user:
    demo_user = User.create({
        'name': 'Demo User',
        'login': '$DEMO_USER_LOGIN',
        'password': '$DEMO_USER_PASSWORD',
        'groups_id': [(6, 0, [env.ref('base.group_user').id])],
    })
    print(f"Created demo user: {demo_user.login}")
else:
    print(f"Demo user already exists: {demo_user.login}")

# Generate API key for demo user
key = ApiKey.with_user(demo_user)._generate(
    scope='rn-odoo-example',
    name='$API_KEY_NAME',
    expiration_date=datetime.now() + timedelta(days=90),
)
print(f"API key generated for {demo_user.login}")

# Write key to file so the host can read it
with open('$API_KEY_FILE', 'w') as f:
    f.write(key)

PYEOF

  if [ -f "$API_KEY_FILE" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Demo API Key for rn-odoo example app:"
    echo "  $(cat "$API_KEY_FILE")"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
  fi
}

run_initialization() {
  if [ -f "$INIT_MARKER" ]; then
    echo "✅ Initialization already done. Skipping..."
    return 0
  fi

  wait_for_postgres

  if database_exists; then
    echo "✅ Database '$DB_NAME' already exists"
  else
    echo "🛠️ Creating database '$DB_NAME' and initializing base modules..."
    odoo --config /etc/odoo/odoo.conf --init base --database "$DB_NAME" --stop-after-init
    echo "✅ Database '$DB_NAME' created"
  fi

  setup_demo_user_and_key

  touch "$INIT_MARKER"
  echo "✅ Initialization complete."
}

# Run initialization, then start Odoo normally
run_initialization

echo "🚀 Starting Odoo..."
exec odoo --config /etc/odoo/odoo.conf "$@"
