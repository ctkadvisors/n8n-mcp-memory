/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { project } from './project';
export type projectList = {
    data?: Array<project>;
    /**
     * Paginate through projects by setting the cursor parameter to a nextCursor attribute returned by a previous request. Default value fetches the first "page" of the collection.
     */
    nextCursor?: string | null;
};

