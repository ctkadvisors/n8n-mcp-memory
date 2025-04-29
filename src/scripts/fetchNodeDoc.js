/**
 * Simple script to fetch n8n node documentation
 * 
 * This script can be used to directly fetch documentation for a specific n8n node
 * to debug and test the documentation fetching functionality.
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

// The node type to fetch documentation for
const nodeType = process.argv[2] || 'n8n-nodes-base.httpRequest';

// Function to extract node name from nodeType
function getNodeName(nodeType) {
  return nodeType.split('.').pop();
}

// Function to fetch documentation from n8n docs site
async function fetchDocumentation(nodeType) {
  try {
    // Try different URL patterns for the documentation
    const nodeName = getNodeName(nodeType);
    
    const possibleUrls = [
      `https://docs.n8n.io/integrations/builtin/core-nodes/${nodeType}/`,
      `https://docs.n8n.io/integrations/builtin/app-nodes/${nodeType}/`,
      `https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.${nodeName}/`,
      `https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.${nodeName}/`,
      `https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-base.${nodeName}/`
    ];
    
    let html = null;
    let successfulUrl = null;
    
    // Try each URL until we find one that works
    for (const url of possibleUrls) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await axios.get(url);
        if (response.status === 200) {
          html = response.data;
          successfulUrl = url;
          break;
        }
      } catch (error) {
        console.log(`URL ${url} failed: ${error.message}`);
      }
    }
    
    if (!html) {
      console.error(`Could not fetch documentation for ${nodeType} from any URL`);
      return null;
    }
    
    console.log(`Successfully fetched documentation from: ${successfulUrl}`);
    
    // Parse the HTML to extract documentation
    const $ = cheerio.load(html);
    
    // Extract basic information
    const displayName = $('h1').first().text().trim() || formatNodeName(nodeName);
    
    // Get the main description
    let description = '';
    $('h1').first().next('p').each((_, element) => {
      description += $(element).text().trim() + ' ';
    });
    
    if (!description) {
      description = $('main p').first().text().trim();
    }
    
    // Create the documentation object
    const doc = {
      nodeType,
      displayName,
      description: description.trim(),
      version: '1.0',
      parameters: [],
      examples: [],
      sourceUrl: successfulUrl,
      fetchedAt: new Date(),
    };
    
    // Save the documentation to a file
    const cacheDir = path.join