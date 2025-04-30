/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { tag } from '../models/tag.js';
import type { tagList } from '../models/tagList.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class TagsService {
  /**
   * Create a tag
   * Create a tag in your instance.
   * @param requestBody Created tag object.
   * @returns tag A tag object
   * @throws ApiError
   */
  public static postTags(requestBody: tag): CancelablePromise<tag> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/tags',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `The request is invalid or provides malformed data.`,
        401: `Unauthorized`,
        409: `Conflict`,
      },
    });
  }
  /**
   * Retrieve all tags
   * Retrieve all tags from your instance.
   * @param limit The maximum number of items to return.
   * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
   * @returns tagList Operation successful.
   * @throws ApiError
   */
  public static getTags(limit: number = 100, cursor?: string): CancelablePromise<tagList> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/tags',
      query: {
        limit: limit,
        cursor: cursor,
      },
      errors: {
        401: `Unauthorized`,
      },
    });
  }
  /**
   * Retrieves a tag
   * Retrieves a tag.
   * @param id The ID of the tag.
   * @returns tag Operation successful.
   * @throws ApiError
   */
  public static getTags1(id: string): CancelablePromise<tag> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/tags/{id}',
      path: {
        id: id,
      },
      errors: {
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
      },
    });
  }
  /**
   * Delete a tag
   * Deletes a tag.
   * @param id The ID of the tag.
   * @returns tag Operation successful.
   * @throws ApiError
   */
  public static deleteTags(id: string): CancelablePromise<tag> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/tags/{id}',
      path: {
        id: id,
      },
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `The specified resource was not found.`,
      },
    });
  }
  /**
   * Update a tag
   * Update a tag.
   * @param id The ID of the tag.
   * @param requestBody Updated tag object.
   * @returns tag Tag object
   * @throws ApiError
   */
  public static putTags(id: string, requestBody: tag): CancelablePromise<tag> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/tags/{id}',
      path: {
        id: id,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `The request is invalid or provides malformed data.`,
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
        409: `Conflict`,
      },
    });
  }
}
