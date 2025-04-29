/**
 * Documentation Update Script
 * 
 * This script fetches and indexes n8n node documentation for the vector store.
 * It can be run periodically to keep documentation up-to-date.
 */

import { DocFetcher } from "../documentation/docFetcher.js";
import { VectorStore } from "../documentation/vectorStore.js";
import { LocalEmbeddingService } from "../documentation/embeddingService.js";
import { config } from "dotenv";

// Load environment variables
config();

/**
 * Main function to update documentation cache
 */
async function updateDocumentation(): Promise<void> {
  console.log("Starting documentation update...");
  
  // Create instances of components
  const fetcher = new DocFetcher();
  const embeddingService = new LocalEmbeddingService();
  const vectorStore = new VectorStore(null, embeddingService, true);
  
  try {
    // Initialize components
    console.log("Initializing components...");
    await fetcher.initialize();
    await embeddingService.initialize();
    await vectorStore.initialize();
    
    // Fetch all available nodes
    console.log("Fetching documentation for all nodes...");
    const allDocs = await fetcher.fetchAllNodes();
    console.log(`Found ${allDocs.length} nodes to process`);
    
    // Process and store documentation
    let processed = 0;
    for (const doc of allDocs) {
      try {
        await vectorStore.storeDocumentation(doc);
        processed++;
        
        // Log progress
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${allDocs.length} nodes`);
        }
      } catch (error) {
        console.error(`Error processing ${doc.nodeType}:`, error);
      }
    }
    
    console.log(`Documentation update complete. Processed ${processed}/${allDocs.length} nodes successfully.`);
  } catch (error) {
    console.error("Error updating documentation:", error);
  } finally {
    // Clean up
    await vectorStore.close();
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDocumentation()
    .then(() => {
      console.log("Documentation update script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Documentation update script failed:", error);
      process.exit(1);
    });
}
