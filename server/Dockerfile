FROM oven/bun:alpine AS release

RUN apk add --update --no-cache curl rsnapshot openssh flock rsync && \
    rm -rf /root/.cache /tmp/*

ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=71b0d58cc53f6bd72cf2f293e09e294b79c666d8 \
    SUPERCRONIC=supercronic-linux-amd64

RUN curl -fsSLO "$SUPERCRONIC_URL" \
	&& echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
	&& chmod +x "$SUPERCRONIC" \
	&& mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
	&& ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

RUN mkdir -p /config /snapshots /app && \
    chown -R bun:bun /config /snapshots /app

RUN ssh-keygen -A

COPY --chown=bun:bun app/ /app

USER bun

WORKDIR /app

VOLUME ["/config", "/snapshots"]

ENTRYPOINT ["bun", "run", "/app/init.ts"]