import { n8nService } from '../src/services/n8nService.js';

async function main() {
  try {
    console.log('Testing n8n service...');
    
    // Test getting workflows
    console.log('\nFetching workflows...');
    const workflows = await n8nService.getWorkflows();
    console.log('Workflows:', JSON.stringify(workflows, null, 2));
    
    // Test getting tags
    console.log('\nFetching tags...');
    const tags = await n8nService.getTags();
    console.log('Tags:', JSON.stringify(tags, null, 2));
    
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Error testing n8n service:', error);
  }
}

main();
