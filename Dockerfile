# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Always install dependencies fresh (node_modules is never copied from host)
RUN npm ci --no-audit

# Copy the rest of the source (node_modules excluded via .dockerignore)
COPY . .

# Build the application
# Set NEXT_TELEMETRY_DISABLED to skip telemetry and reduce external network calls
ENV NEXT_TELEMETRY_DISABLED=1
# Note: Google Fonts will be fetched at build time. In offline environments, fonts will use fallbacks.
RUN npm run build || (echo "Build failed - this may be due to network issues fetching fonts" && exit 1)

# Runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser

# Copy built application
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
