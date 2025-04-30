/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { create_credential_response } from '../models/create_credential_response.js';
import type { credential } from '../models/credential.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class CredentialService {
  /**
   * Create a credential
   * Creates a credential that can be used by nodes of the specified type.
   * @param requestBody Credential to be created.
   * @returns create_credential_response Operation successful.
   * @throws ApiError
   */
  public static postCredentials(
    requestBody: credential
  ): CancelablePromise<create_credential_response> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/credentials',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        401: `Unauthorized`,
        415: `Unsupported media type.`,
      },
    });
  }
  /**
   * Delete credential by ID
   * Deletes a credential from your instance. You must be the owner of the credentials
   * @param id The credential ID that needs to be deleted
   * @returns credential Operation successful.
   * @throws ApiError
   */
  public static deleteCredential(id: string): CancelablePromise<credential> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/credentials/{id}',
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
   * Show credential data schema
   * @param credentialTypeName The credential type name that you want to get the schema for
   * @returns any Operation successful.
   * @throws ApiError
   */
  public static getCredentialsSchema(
    credentialTypeName: string
  ): CancelablePromise<Record<string, any>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/credentials/schema/{credentialTypeName}',
      path: {
        credentialTypeName: credentialTypeName,
      },
      errors: {
        401: `Unauthorized`,
        404: `The specified resource was not found.`,
      },
    });
  }
}
