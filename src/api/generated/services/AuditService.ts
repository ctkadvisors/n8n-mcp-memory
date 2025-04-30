/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { audit } from '../models/audit.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AuditService {
  /**
   * Generate an audit
   * Generate a security audit for your n8n instance.
   * @param requestBody
   * @returns audit Operation successful.
   * @throws ApiError
   */
  public static postAudit(requestBody?: {
    additionalOptions?: {
      /**
       * Days for a workflow to be considered abandoned if not executed
       */
      daysAbandonedWorkflow?: number;
      categories?: Array<'credentials' | 'database' | 'nodes' | 'filesystem' | 'instance'>;
    };
  }): CancelablePromise<audit> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/audit',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        401: `Unauthorized`,
        500: `Internal server error.`,
      },
    });
  }
}
