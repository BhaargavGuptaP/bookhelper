import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { Documents } from "@bookhelper/api-contracts";
import { ZodBody } from "../common/zod.pipe.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { Principal } from "../auth/auth.types.js";
import { CollectionsService } from "./collections.service.js";
import type { LibraryContext } from "./library.repository.js";

/** Collections HTTP surface — list / create / rename / delete. */
@Controller("v1/collections")
export class CollectionsController {
  constructor(private readonly svc: CollectionsService) {}

  @Get()
  list(@CurrentUser() user: Principal): Promise<Documents.Collection[]> {
    return this.svc.list(ctx(user));
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: Principal,
    @Body(new ZodBody(Documents.createCollectionRequest))
    body: Documents.CreateCollectionRequest,
  ): Promise<Documents.Collection> {
    return this.svc.create(ctx(user), body);
  }

  @Patch(":id")
  rename(
    @CurrentUser() user: Principal,
    @Param("id") id: string,
    @Body(new ZodBody(Documents.renameCollectionRequest))
    body: Documents.RenameCollectionRequest,
  ): Promise<Documents.Collection> {
    return this.svc.rename(ctx(user), id as Documents.CollectionId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: Principal, @Param("id") id: string): Promise<void> {
    await this.svc.delete(ctx(user), id as Documents.CollectionId);
  }
}

function ctx(user: Principal): LibraryContext {
  return { tenantId: user.tenantId, ownerId: user.userId };
}
