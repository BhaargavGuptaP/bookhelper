import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ValidationError,
  toProblemDetails,
  errorStatusFor,
} from "./errors.js";
import { ProblemDetails, isProblemDetails } from "./problem-details.js";

describe("AppError catalogue", () => {
  it("pins status + code for known errors", () => {
    expect(new BadRequestError().status).toBe(400);
    expect(new BadRequestError().code).toBe("E_BAD_REQUEST");
    expect(new NotFoundError().status).toBe(404);
    expect(new ValidationError().status).toBe(422);
  });

  it("preserves the `cause` chain server-side without serializing it", () => {
    const root = new Error("db is on fire");
    const err = new NotFoundError("widget missing", { cause: root });
    expect(err.cause).toBe(root);
    // Sanity: AppError is a real Error.
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it("carries structured extensions through to the wire shape", () => {
    const err = new ValidationError("Invalid payload", {
      extensions: { fieldErrors: { title: ["Required"] } },
    });
    const pd = toProblemDetails(err).toJSON();
    expect(pd["fieldErrors"]).toEqual({ title: ["Required"] });
  });
});

describe("toProblemDetails()", () => {
  it("renders a typed AppError into RFC 9457 shape", () => {
    const err = new NotFoundError("Book #42 missing", {
      instance: "/v1/books/42",
    });
    const pd = toProblemDetails(err);
    expect(pd).toBeInstanceOf(ProblemDetails);
    const json = pd.toJSON();
    expect(json).toMatchObject({
      type: "https://bookhelper.app/problems/not_found",
      title: "Not found",
      status: 404,
      detail: "Book #42 missing",
      instance: "/v1/books/42",
      code: "E_NOT_FOUND",
    });
  });

  it("collapses untyped errors to 500 and hides detail in production", () => {
    const pd = toProblemDetails(new Error("ECONNRESET upstream"), {
      isProduction: true,
    });
    const json = pd.toJSON();
    expect(json["status"]).toBe(500);
    expect(json["title"]).toBe("Internal server error");
    expect(json["detail"]).toBeUndefined();
  });

  it("reveals detail off-prod for debuggability", () => {
    const pd = toProblemDetails(new Error("boom"), { isProduction: false });
    expect(pd.toJSON()["detail"]).toBe("boom");
  });

  it("errorStatusFor() maps AppError → status, else 500", () => {
    expect(errorStatusFor(new BadRequestError())).toBe(400);
    expect(errorStatusFor("plain string")).toBe(500);
    expect(errorStatusFor(undefined)).toBe(500);
  });
});

describe("isProblemDetails()", () => {
  it("validates the minimum required shape", () => {
    expect(isProblemDetails({ title: "x", status: 400 })).toBe(true);
    expect(isProblemDetails({ title: "x" })).toBe(false);
    expect(isProblemDetails(null)).toBe(false);
    expect(isProblemDetails({ title: "x", status: "400" })).toBe(false);
  });
});

describe("ProblemDetails.toJSON()", () => {
  it("never lets an extension overwrite a reserved member", () => {
    const pd = new ProblemDetails({
      title: "ok",
      status: 200,
      extensions: { status: 999, custom: "yes" },
    });
    const j = pd.toJSON();
    expect(j["status"]).toBe(200);
    expect(j["custom"]).toBe("yes");
  });
});
