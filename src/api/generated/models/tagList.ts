/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { tag } from './tag.js';
export type tagList = {
  data?: Array<tag>;
  /**
   * Paginate through tags by setting the cursor parameter to a nextCursor attribute returned by a previous request. Default value fetches the first "page" of the collection.
   */
  nextCursor?: string | null;
};
