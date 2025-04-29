// Make Jest available globally for ESM modules
import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';

// Export all Jest globals so they can be imported in test files
export { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll };

// Also make them available globally for backward compatibility
Object.assign(global, { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll });
