/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { project } from '../models/project';
import type { projectList } from '../models/projectList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectsService {
    /**
     * Create a project
     * Create a project in your instance.
     * @param requestBody Payload for project to create.
     * @returns any Operation successful.
     * @throws ApiError
     */
    public static postProjects(
        requestBody: project,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/projects',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Retrieve projects
     * Retrieve projects from your instance.
     * @param limit The maximum number of items to return.
     * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
     * @returns projectList Operation successful.
     * @throws ApiError
     */
    public static getProjects(
        limit: number = 100,
        cursor?: string,
    ): CancelablePromise<projectList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/projects',
            query: {
                'limit': limit,
                'cursor': cursor,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Delete a project
     * Delete a project from your instance.
     * @param projectId The ID of the project.
     * @returns void
     * @throws ApiError
     */
    public static deleteProjects(
        projectId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/projects/{projectId}',
            path: {
                'projectId': projectId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `The specified resource was not found.`,
            },
        });
    }
}
