import { Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validate (and brand/coerce) input with a zod schema. On failure the thrown
 * ZodError is mapped by the global exception filter to an RFC 9457
 * ValidationError (422) with `fieldErrors`. Usage:
 *
 *   @Body(new ZodBody(updateDocumentRequest)) body: UpdateDocumentRequest
 */
@Injectable()
export class ZodBody<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}
  transform(value: unknown): T {
    return this.schema.parse(value);
  }
}
