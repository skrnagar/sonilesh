export const OPENAPI_DOCUMENT = {
  openapi: "3.0.3",
  info: {
    title: "SONIL EHS360 Public API",
    version: "v1",
    description:
      "Tenant-scoped REST API. Authenticate with a session cookie or a hashed organization API key (Bearer ehs_live_…). Client-supplied organization_id is ignored.",
  },
  servers: [{ url: "/api/v1" }],
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "sb-access-token" },
    },
    parameters: {
      page: { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
      pageSize: { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
      sort: { name: "sort", in: "query", schema: { type: "string" } },
      order: { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
      status: { name: "status", in: "query", schema: { type: "string" } },
      siteId: { name: "site_id", in: "query", schema: { type: "string", format: "uuid" } },
    },
  },
  paths: {
    "/incidents": { get: { summary: "List incidents", security: [{ bearerAuth: [] }] } },
    "/incidents/{id}": { get: { summary: "Get incident", security: [{ bearerAuth: [] }] } },
    "/capa": { get: { summary: "List CAPA items", security: [{ bearerAuth: [] }] } },
    "/capa/{id}": { get: { summary: "Get CAPA item", security: [{ bearerAuth: [] }] } },
    "/sites": { get: { summary: "List sites", security: [{ bearerAuth: [] }] } },
    "/sites/{id}": { get: { summary: "Get site", security: [{ bearerAuth: [] }] } },
    "/projects": { get: { summary: "List projects", security: [{ bearerAuth: [] }] } },
    "/projects/{id}": { get: { summary: "Get project", security: [{ bearerAuth: [] }] } },
    "/permits": { get: { summary: "List permits", security: [{ bearerAuth: [] }] } },
    "/permits/{id}": { get: { summary: "Get permit", security: [{ bearerAuth: [] }] } },
    "/training": { get: { summary: "List training assignments", security: [{ bearerAuth: [] }] } },
    "/webhooks/inbound/{connector}": {
      post: {
        summary: "Inbound webhook receiver (HMAC signature required)",
        security: [],
      },
    },
  },
};
