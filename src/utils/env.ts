import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variable schema
const envSchema = z.object({
  N8N_API_URL: z.string().url().default('http://localhost:5678/api/v1'),
  N8N_API_KEY: z.string().min(1).default('test-api-key'),
});

// Parse and validate environment variables
// Use safeParse to handle missing environment variables gracefully
const result = envSchema.safeParse(process.env);

// Use parsed values if validation succeeded, or default values if it failed
export const env = result.success
  ? result.data
  : {
      N8N_API_URL: 'http://localhost:5678/api/v1',
      N8N_API_KEY: 'test-api-key',
    };

// Export typed environment variables
export default env;
