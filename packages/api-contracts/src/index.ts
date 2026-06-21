/**
 * @bookhelper/api-contracts
 *
 * The web ↔ core-api boundary. Schemas are defined with zod; types are
 * inferred. Both sides must import from here — no parallel TS interfaces.
 *
 * Scope in Sprint 1 (FOUNDATION ONLY):
 *   • Health/readiness response.
 *   • Auth/session "Me" response (the shape the JWT verification yields).
 *   • Storage presigned-upload request/response (ARCHITECTURE.md §11).
 *   • Problem-details wire schema (the universal error envelope).
 *
 * Anything beyond foundation lives in the relevant Sprint.
 */

export * as Health from "./health.js";
export * as Auth from "./auth.js";
export * as Storage from "./storage.js";
export * as Errors from "./errors.js";
export * as Documents from "./documents.js";
export * as Audit from "./audit.js";

export { problem } from "./errors.js";
