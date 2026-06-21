import { Global, Module } from "@nestjs/common";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import { LocalStorageDriver } from "./local.driver.js";
import { S3StorageDriver } from "./s3.driver.js";
import type { StorageDriver } from "./storage.types.js";

/** DI token for the resolved storage driver. */
export const STORAGE = Symbol.for("@bookhelper/core-api/storage");

/**
 * Storage module — chooses the driver from env at boot and exposes it via
 * the `STORAGE` token. Adding a new driver = a new class + a `case` here.
 */
/**
 * The S3 driver constructor will throw if credentials are missing — so we
 * resolve it lazily inside the factory only when the env actually selects
 * `s3`. The local driver has no boot-time dependencies and stays eager.
 */
@Global()
@Module({
  providers: [
    LocalStorageDriver,
    {
      provide: STORAGE,
      inject: [ENV, LocalStorageDriver],
      useFactory: (env: Env, local: LocalStorageDriver): StorageDriver => {
        switch (env.STORAGE_DRIVER) {
          case "local":
            return local;
          case "s3":
            return new S3StorageDriver(env);
          default: {
            const exhaustive: never = env.STORAGE_DRIVER;
            throw new Error(`Unknown STORAGE_DRIVER: ${String(exhaustive)}`);
          }
        }
      },
    },
  ],
  exports: [STORAGE],
})
export class StorageModule {}
