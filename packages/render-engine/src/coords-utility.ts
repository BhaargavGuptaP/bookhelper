/**
 * **CoordinatesUtility** — small object the runtime exposes for
 * Reader UI / plugin code to translate between
 * (page, y) ↔ scrollTop ↔ PointLocator without re-deriving the
 * `docId`/`docVersion`/`blockIdForPage` triple every time.
 */

import type { BlockId, DocVersion, PointLocator } from "@bookhelper/reader-core";
import {
  pointLocatorForPage,
  pointToScroll,
  scrollToPoint,
  type DocumentPoint,
  type ScrollToInput,
} from "./coordinates.js";
import type { MeasurementsState } from "./measurements.js";

export interface CoordinatesUtility {
  scrollToPoint(scrollTop: number, zoom: number, measurements: MeasurementsState): DocumentPoint;
  pageToScroll(input: ScrollToInput, measurements: MeasurementsState): number;
  pageLocator(page: number, offset?: number, globalOffset?: number): PointLocator;
  blockIdForPage(page: number): BlockId;
}

export interface CreateCoordinatesUtilityOptions {
  readonly docId: string;
  readonly docVersion: DocVersion;
  readonly blockIdForPage: (page: number) => BlockId;
}

export function createCoordinatesUtility(
  options: CreateCoordinatesUtilityOptions,
): CoordinatesUtility {
  void options.docId; // reserved for future use (e.g. cross-doc bookmark resolution)
  return {
    scrollToPoint(scrollTop, zoom, measurements) {
      return scrollToPoint(scrollTop, zoom, measurements);
    },
    pageToScroll(input, measurements) {
      return pointToScroll(input, measurements);
    },
    pageLocator(page, offset, globalOffset) {
      return pointLocatorForPage({
        docVersion: options.docVersion,
        page,
        ...(offset !== undefined ? { offset } : {}),
        ...(globalOffset !== undefined ? { globalOffset } : {}),
        blockIdForPage: options.blockIdForPage,
      });
    },
    blockIdForPage(page) {
      return options.blockIdForPage(page);
    },
  };
}
