/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { importResult } from '../models/importResult';
import type { pull } from '../models/pull';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SourceControlService {
    /**
     * Pull changes from the remote repository
     * Requires the Source Control feature to be licensed and connected to a repository.
     * @param requestBody Pull options
     * @returns importResult Import result
     * @throws ApiError
     */
    public static postSourceControlPull(
        requestBody: pull,
    ): CancelablePromise<importResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/source-control/pull',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The request is invalid or provides malformed data.`,
                409: `Conflict`,
            },
        });
    }
}
