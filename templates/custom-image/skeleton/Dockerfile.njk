ARG UPSTREAM_IMAGE=${{ values.upstreamImage }}
FROM ${UPSTREAM_IMAGE}

# Inject minicloud CA cert at build time — never committed to git.
# Build: docker build --build-arg CA_CERT="$(cat ~/minicloud-ca.crt)" .
# CI:    build-args: CA_CERT=${{ "${{ secrets.MINICLOUD_CA_CERT }}" }}
ARG CA_CERT

# For Debian/Ubuntu-based images:
USER root
RUN if [ -n "${CA_CERT}" ]; then \
      printf '%s\n' "${CA_CERT}" \
        > /usr/local/share/ca-certificates/minicloud-ca.crt && \
      update-ca-certificates; \
    fi

# For Node.js services that ignore the OS trust store:
# ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/minicloud-ca.crt

# For Alpine-based images replace the RUN block above with:
# RUN apk add --no-cache ca-certificates && \
#     printf '%s\n' "${CA_CERT}" > /usr/local/share/ca-certificates/minicloud-ca.crt && \
#     update-ca-certificates
