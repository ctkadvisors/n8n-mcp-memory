import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variable schema
const envSchema = z.object({
  N8N_API_URL: z.string().url(),
  N8N_API_KEY: z.string().min(1),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Export typed environment variables
export default env;
