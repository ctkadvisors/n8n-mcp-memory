/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { variable } from './variable';
export type variableList = {
    data?: Array<variable>;
    /**
     * Paginate through variables by setting the cursor parameter to a nextCursor attribute returned by a previous request. Default value fetches the first "page" of the collection.
     */
    nextCursor?: string | null;
};

