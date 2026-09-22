# Peptra has no dependencies and no build step, so the image is just the
# runtime plus the source.
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY server/ ./server/
COPY public/ ./public/

# The waitlist is a file on disk. Mount a volume here or signups die with
# the container — see DEPLOY.md.
RUN mkdir -p /data && chown -R node:node /data /app
ENV WAITLIST_FILE=/data/waitlist.jsonl
VOLUME ["/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/server.js"]
