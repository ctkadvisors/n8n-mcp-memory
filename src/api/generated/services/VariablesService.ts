/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { variable } from '../models/variable';
import type { variableList } from '../models/variableList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VariablesService {
    /**
     * Create a variable
     * Create a variable in your instance.
     * @param requestBody Payload for variable to create.
     * @returns any Operation successful.
     * @throws ApiError
     */
    public static postVariables(
        requestBody: variable,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/variables',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Retrieve variables
     * Retrieve variables from your instance.
     * @param limit The maximum number of items to return.
     * @param cursor Paginate by setting the cursor parameter to the nextCursor attribute returned by the previous request's response. Default value fetches the first "page" of the collection. See pagination for more detail.
     * @returns variableList Operation successful.
     * @throws ApiError
     */
    public static getVariables(
        limit: number = 100,
        cursor?: string,
    ): CancelablePromise<variableList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/variables',
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
     * Delete a variable
     * Delete a variable from your instance.
     * @param id The ID of the variable.
     * @returns void
     * @throws ApiError
     */
    public static deleteVariables(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/variables/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `The specified resource was not found.`,
            },
        });
    }
}
