FROM odoo:19.0

USER root

# Install PostgreSQL client tools for pg_isready/psql used by entrypoint
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER odoo

ENTRYPOINT ["/entrypoint.sh"]
CMD []
