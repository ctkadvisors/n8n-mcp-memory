/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { tagIds } from '../models/tagIds';
import type { workflow } from '../models/workflow';
import type { workflowList } from '../models/workflowList';
import type { workflowTags } from '../models/workflowTags';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkflowService {
    /**
     * Create a workflow
     * Create a workflow in your instance.
     * @param requestBody Created workflow object.
     * @returns workflow A workflow object
     * @throws ApiError
     */
    public static postWorkflows(
        requestBody: workflow,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflows',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Retrieve all workflows
     * Retrieve all workflows from your instance.
     * @param active
     * @param tags
     * @param name
     * @param projectId
     * @param excludePinnedData Set this to avoid retrieving pinned data
     * @param limit The maximum number of items to return.
     * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
     * @returns workflowList Operation successful.
     * @throws ApiError
     */
    public static getWorkflows(
        active?: boolean,
        tags?: string,
        name?: string,
        projectId?: string,
        excludePinnedData?: boolean,
        limit: number = 100,
        cursor?: string,
    ): CancelablePromise<workflowList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/workflows',
            query: {
                'active': active,
                'tags': tags,
                'name': name,
                'projectId': projectId,
                'excludePinnedData': excludePinnedData,
                'limit': limit,
                'cursor': cursor,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Retrieves a workflow
     * Retrieves a workflow.
     * @param id The ID of the workflow.
     * @param excludePinnedData Set this to avoid retrieving pinned data
     * @returns workflow Operation successful.
     * @throws ApiError
     */
    public static getWorkflows1(
        id: string,
        excludePinnedData?: boolean,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/workflows/{id}',
            path: {
                'id': id,
            },
            query: {
                'excludePinnedData': excludePinnedData,
            },
            errors: {
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Delete a workflow
     * Deletes a workflow.
     * @param id The ID of the workflow.
     * @returns workflow Operation successful.
     * @throws ApiError
     */
    public static deleteWorkflows(
        id: string,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/workflows/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Update a workflow
     * Update a workflow.
     * @param id The ID of the workflow.
     * @param requestBody Updated workflow object.
     * @returns workflow Workflow object
     * @throws ApiError
     */
    public static putWorkflows(
        id: string,
        requestBody: workflow,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/workflows/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Activate a workflow
     * Active a workflow.
     * @param id The ID of the workflow.
     * @returns workflow Workflow object
     * @throws ApiError
     */
    public static postWorkflowsActivate(
        id: string,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflows/{id}/activate',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Deactivate a workflow
     * Deactivate a workflow.
     * @param id The ID of the workflow.
     * @returns workflow Workflow object
     * @throws ApiError
     */
    public static postWorkflowsDeactivate(
        id: string,
    ): CancelablePromise<workflow> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/workflows/{id}/deactivate',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Transfer a workflow to another project.
     * Transfer a workflow to another project.
     * @param id The ID of the workflow.
     * @param requestBody Destination project information for the workflow transfer.
     * @returns any Operation successful.
     * @throws ApiError
     */
    public static putWorkflowsTransfer(
        id: string,
        requestBody: {
            /**
             * The ID of the project to transfer the workflow to.
             */
            destinationProjectId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/workflows/{id}/transfer',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Transfer a credential to another project.
     * Transfer a credential to another project.
     * @param id The ID of the credential.
     * @param requestBody Destination project for the credential transfer.
     * @returns any Operation successful.
     * @throws ApiError
     */
    public static putCredentialsTransfer(
        id: string,
        requestBody: {
            /**
             * The ID of the project to transfer the credential to.
             */
            destinationProjectId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/credentials/{id}/transfer',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Get workflow tags
     * Get workflow tags.
     * @param id The ID of the workflow.
     * @returns workflowTags List of tags
     * @throws ApiError
     */
    public static getWorkflowsTags(
        id: string,
    ): CancelablePromise<workflowTags> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/workflows/{id}/tags',
            path: {
                'id': id,
            },
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
    /**
     * Update tags of a workflow
     * Update tags of a workflow.
     * @param id The ID of the workflow.
     * @param requestBody List of tags
     * @returns workflowTags List of tags after add the tag
     * @throws ApiError
     */
    public static putWorkflowsTags(
        id: string,
        requestBody: tagIds,
    ): CancelablePromise<workflowTags> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/workflows/{id}/tags',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
}
