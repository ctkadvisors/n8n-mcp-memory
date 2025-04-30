/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { project } from '../models/project.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class ProjectService {
  /**
   * Update a project
   * Update a project.
   * @param requestBody Updated project object.
   * @returns void
   * @throws ApiError
   */
  public static putProjects(requestBody: project): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/projects/{projectId}',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `The request is invalid or provides malformed data.`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `The specified resource was not found.`,
      },
    });
  }
}
