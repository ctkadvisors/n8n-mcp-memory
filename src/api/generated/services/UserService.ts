/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { user } from '../models/user.js';
import type { userList } from '../models/userList.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class UserService {
  /**
   * Retrieve all users
   * Retrieve all users from your instance. Only available for the instance owner.
   * @param limit The maximum number of items to return.
   * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
   * @param includeRole Whether to include the user's role or not.
   * @param projectId
   * @returns userList Operation successful.
   * @throws ApiError
   */
  public static getUsers(
    limit: number = 100,
    cursor?: string,
    includeRole: boolean = false,
    projectId?: string
  ): CancelablePromise<userList> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/users',
      query: {
        limit: limit,
        cursor: cursor,
        includeRole: includeRole,
        projectId: projectId,
      },
      errors: {
        401: `Unauthorized`,
      },
    });
  }
  /**
   * Create multiple users
   * Create one or more users.
   * @param requestBody Array of users to be created.
   * @returns any Operation successful.
   * @throws ApiError
   */
  public static postUsers(
    requestBody: Array<{
      email: string;
      role?: 'global:admin' | 'global:member';
    }>
  ): CancelablePromise<{
    user?: {
      id?: string;
      email?: string;
      inviteAcceptUrl?: string;
      emailSent?: boolean;
    };
    error?: string;
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/users',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
      },
    });
  }
  /**
   * Get user by ID/Email
   * Retrieve a user from your instance. Only available for the instance owner.
   * @param id The ID or email of the user.
   * @param includeRole Whether to include the user's role or not.
   * @returns user Operation successful.
   * @throws ApiError
   */
  public static getUsers1(id: string, includeRole: boolean = false): CancelablePromise<user> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/users/{id}',
      path: {
        id: id,
      },
      query: {
        includeRole: includeRole,
      },
      errors: {
        401: `Unauthorized`,
      },
    });
  }
  /**
   * Delete a user
   * Delete a user from your instance.
   * @param id The ID or email of the user.
   * @returns void
   * @throws ApiError
   */
  public static deleteUsers(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/users/{id}',
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
   * Change a user's global role
   * Change a user's global role
   * @param id The ID or email of the user.
   * @param requestBody New role for the user
   * @returns any Operation successful.
   * @throws ApiError
   */
  public static patchUsersRole(
    id: string,
    requestBody: {
      newRoleName: 'global:admin' | 'global:member';
    }
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/users/{id}/role',
      path: {
        id: id,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `The specified resource was not found.`,
      },
    });
  }
}
