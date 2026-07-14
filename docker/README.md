# Odoo 19 Demo for rn-odoo

This folder contains a Docker Compose setup that spins up a local Odoo 19 instance with PostgreSQL 16. It is intended for **development and demo purposes** only.

> ⚠️ This Docker setup is **not** included in the published npm package. It is only available when you clone the repository.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick start

```bash
cd docker
docker compose up -d
```

The first startup will:

1. Build a custom image based on `odoo:19.0` (includes `postgresql-client` for the entrypoint).
2. Pull the `postgres:16-alpine` image.
3. Create a database named `demo` and initialize the base modules.
4. Create a demo user `demo` / `demo`.
5. Generate an API key for the demo user and print it to the container logs.

The initialization runs only once. On subsequent starts, the existing database and API key are reused.

## Get the demo API key

After the containers are running, read the generated API key from the Odoo container logs:

```bash
docker logs rn-odoo-demo
```

Look for the block surrounded by `═══════════════════════════════════════`.

Alternatively, the key is written to `/var/lib/odoo/.rn-odoo-api-key` inside the container:

```bash
docker exec rn-odoo-demo cat /var/lib/odoo/.rn-odoo-api-key
```

## Connect the example app

Copy the example environment file and fill in the API key you retrieved above:

```bash
cp example/.env.example example/.env
```

Edit `example/.env`:

```env
EXPO_PUBLIC_ODOO_HOST=http://localhost:8069
EXPO_PUBLIC_ODOO_DATABASE=demo
EXPO_PUBLIC_ODOO_API_KEY=your_api_key_here
```

> On Android Emulator, use `http://10.0.2.2:8069` instead of `localhost`.
> On a physical device, use the LAN IP of the machine running Docker.

Then start the example app from the workspace root:

```bash
yarn workspace example start --clear
```

## Useful URLs

- Odoo web UI: http://localhost:8069
- Login: `admin` / `admin` or `demo` / `demo`
- Database: `demo`

## Stop and clean up

Stop the containers:

```bash
cd docker
docker compose down
```

Remove all data (database + filestore):

```bash
cd docker
docker compose down -v
```

## Troubleshooting

### Port 8069 is already in use

Change the host port in `docker-compose.yml`:

```yaml
ports:
  - "8070:8069"
```

Then use `http://localhost:8070` in the example app.

### Database already exists

If initialization fails because the database already exists, remove the volumes and start fresh:

```bash
cd docker
docker compose down -v
docker compose up -d
```

### Odoo container keeps restarting

Check the logs:

```bash
docker logs rn-odoo-demo
```

Common causes:
- PostgreSQL is not healthy yet — wait a few seconds and restart.
- The `odoo.conf` file is not mounted correctly.
