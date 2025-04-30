/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { execution } from '../models/execution.js';
import type { executionList } from '../models/executionList.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class ExecutionService {
  /**
   * Retrieve all executions
   * Retrieve all executions from your instance.
   * @param includeData Whether or not to include the execution's detailed data.
   * @param status Status to filter the executions by.
   * @param workflowId Workflow to filter the executions by.
   * @param projectId
   * @param limit The maximum number of items to return.
   * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
   * @returns executionList Operation successful.
   * @throws ApiError
   */
  public static getExecutions(
    includeData?: boolean,
    status?: 'error' | 'success' | 'waiting',
    workflowId?: string,
    projectId?: string,
    limit: number = 100,
    cursor?: string
  ): CancelablePromise<executionList> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/executions',
      query: {
        includeData: includeData,
        status: status,
        workflowId: workflowId,
        projectId: projectId,
        limit: limit,
        cursor: cursor,
      },
      errors: {
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
      },
    });
  }
  /**
   * Retrieve an execution
   * Retrieve an execution from your instance.
   * @param id The ID of the execution.
   * @param includeData Whether or not to include the execution's detailed data.
   * @returns execution Operation successful.
   * @throws ApiError
   */
  public static getExecutions1(id: number, includeData?: boolean): CancelablePromise<execution> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/executions/{id}',
      path: {
        id: id,
      },
      query: {
        includeData: includeData,
      },
      errors: {
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
      },
    });
  }
  /**
   * Delete an execution
   * Deletes an execution from your instance.
   * @param id The ID of the execution.
   * @returns execution Operation successful.
   * @throws ApiError
   */
  public static deleteExecutions(id: number): CancelablePromise<execution> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/executions/{id}',
      path: {
        id: id,
      },
      errors: {
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
      },
    });
  }
}
