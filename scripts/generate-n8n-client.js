import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI_SPEC_URL = 'https://docs.n8n.io/api/v1/openapi.yml';
const OPENAPI_SPEC_PATH = path.join(__dirname, '..', 'src', 'api', 'n8n-openapi.yml');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'api', 'generated');

// Create directories if they don't exist
if (!fs.existsSync(path.dirname(OPENAPI_SPEC_PATH))) {
  fs.mkdirSync(path.dirname(OPENAPI_SPEC_PATH), { recursive: true });
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Download the OpenAPI spec
console.log(`Downloading OpenAPI spec from ${OPENAPI_SPEC_URL}...`);
const file = fs.createWriteStream(OPENAPI_SPEC_PATH);

https.get(OPENAPI_SPEC_URL, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`OpenAPI spec downloaded to ${OPENAPI_SPEC_PATH}`);
    
    // Generate the client
    console.log(`Generating client in ${OUTPUT_DIR}...`);
    try {
      execSync(`npx openapi-typescript-codegen --input ${OPENAPI_SPEC_PATH} --output ${OUTPUT_DIR} --client axios`, { stdio: 'inherit' });
      console.log('Client generated successfully!');
    } catch (error) {
      console.error('Error generating client:', error);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  fs.unlink(OPENAPI_SPEC_PATH);
  console.error('Error downloading OpenAPI spec:', err);
  process.exit(1);
});
