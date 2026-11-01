FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build

WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . ./

# The service already requests /api/assets. A root base preserves that prefix
# and lets Nginx proxy API requests on the same origin as the site.
ENV VITE_API_BASE_URL=/

RUN npm run lint
RUN npm test
RUN npm run build

FROM nginx:stable-alpine@sha256:0e52bd054126cdc040b1276c0af347aeb02a41b9cfe305d6094767ac30e97949 AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/

EXPOSE 80
