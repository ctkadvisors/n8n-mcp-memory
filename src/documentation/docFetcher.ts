/**
 * n8n Documentation Fetcher
 *
 * This module is responsible for fetching and processing n8n node documentation.
 * It retrieves documentation from various sources, processes it into a structured format,
 * and prepares it for indexing and storage.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

// Types for documentation data
export interface NodeDocumentation {
  nodeType: string;
  displayName: string;
  description: string;
  version: string;
  parameters: ParameterDocumentation[];
  examples: Example[];
  sourceUrl: string;
  fetchedAt: Date;
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  options?: any[];
}

export interface Example {
  title: string;
  description: string;
  code?: string;
}

/**
 * Documentation Fetcher class
 */
export class DocFetcher {
  private baseUrl: string;
  private cacheDir: string;
  private nodeListUrl: string;

  /**
   * Create a new DocFetcher instance
   *
   * @param baseUrl - Base URL for n8n documentation
   * @param cacheDir - Directory to cache documentation files
   * @param nodeListUrl - URL to fetch the list of available nodes
   */
  constructor(
    baseUrl = "https://docs.n8n.io/integrations/builtin/",
    cacheDir = path.join(process.cwd(), "cache", "docs"),
    nodeListUrl = "https://docs.n8n.io/integrations/builtin/node-types/"
  ) {
    this.baseUrl = baseUrl;
    this.cacheDir = cacheDir;
    this.nodeListUrl = nodeListUrl;
  }

  /**
   * Initialize the documentation fetcher
   */
  async initialize(): Promise<void> {
    // Create cache directory if it doesn't exist
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  /**
   * Fetch documentation for all nodes
   *
   * @returns Array of node documentation objects
   */
  async fetchAllNodes(): Promise<NodeDocumentation[]> {
    try {
      console.log("Fetching documentation for all nodes...");

      // Fetch the list of nodes from the n8n documentation site
      const response = await axios.get(this.nodeListUrl);
      const html = response.data;

      // Parse the HTML to extract links to node documentation
      const $ = cheerio.load(html);
      const nodeLinks: string[] = [];

      // Look for links to node documentation pages
      $('a[href*="/integrations/builtin/"]').each((_, element) => {
        const href = $(element).attr("href");
        if (
          href &&
          !nodeLinks.includes(href) &&
          (href.includes("/core-nodes/n8n-nodes-base.") ||
            href.includes("/app-nodes/n8n-nodes-base.") ||
            href.includes("/trigger-nodes/n8n-nodes-base.") ||
            href.includes("/cluster-nodes/root-nodes/n8n-nodes-langchain.") ||
            href.includes("/cluster-nodes/sub-nodes/n8n-nodes-langchain."))
        ) {
          nodeLinks.push(href);
        }
      });

      // Add additional links for LangChain nodes that might not be in the main navigation
      const langchainRootNodes = [
        "agent",
        "chainllm",
        "chainretrievalqa",
        "chainsummarization",
        "information-extractor",
        "text-classifier",
        "sentimentanalysis",
        "code",
        "vectorstoreinmemory",
        "vectorstoremilvus",
        "vectorstoremongodbatlas",
        "vectorstorepgvector",
        "vectorstorepinecone",
        "vectorstoreqdrant",
        "vectorstoresupabase",
        "vectorstorezep",
        "lmchatopenai",
        "lmchatollama",
        "embeddingsopenai",
        "chattrigger",
        "mcptrigger",
      ];

      for (const nodeName of langchainRootNodes) {
        const nodeType = `n8n-nodes-langchain.${nodeName}`;
        const url = `/integrations/builtin/cluster-nodes/root-nodes/${nodeType}/`;
        if (!nodeLinks.includes(url)) {
          nodeLinks.push(url);
        }
      }

      console.log(`Found ${nodeLinks.length} node documentation links`);

      // Process each link to get node documentation
      const allDocumentation: NodeDocumentation[] = [];

      for (const link of nodeLinks) {
        // Extract node type from the URL
        const baseNodeTypeMatch = link.match(/n8n-nodes-base\.([^\/]+)/);
        const langchainNodeTypeMatch = link.match(
          /n8n-nodes-langchain\.([^\/]+)/
        );

        let nodeType: string | null = null;
        let nodeName: string | null = null;

        if (baseNodeTypeMatch && baseNodeTypeMatch[1]) {
          nodeName = baseNodeTypeMatch[1];
          nodeType = `n8n-nodes-base.${nodeName}`;
        } else if (langchainNodeTypeMatch && langchainNodeTypeMatch[1]) {
          nodeName = langchainNodeTypeMatch[1];
          nodeType = `n8n-nodes-langchain.${nodeName}`;
        }

        if (nodeType && nodeName) {
          try {
            // Check cache first
            const cachedDoc = await this.getFromCache(nodeType);
            if (cachedDoc) {
              allDocumentation.push(cachedDoc);
              continue;
            }

            // Fetch documentation if not in cache
            const fullUrl = link.startsWith("http")
              ? link
              : `https://docs.n8n.io${link}`;
            const nodeResponse = await axios.get(fullUrl);
            const nodeHtml = nodeResponse.data;

            // Parse the node documentation
            const doc = this.parseDocumentation(nodeType, nodeHtml, fullUrl);

            // Save to cache
            await this.saveToCache(nodeType, doc);

            allDocumentation.push(doc);

            // Add a small delay to avoid overwhelming the server
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error(
              `Error fetching documentation for ${nodeType}:`,
              error
            );
          }
        }
      }

      return allDocumentation;
    } catch (error) {
      console.error("Error fetching all nodes:", error);
      throw error;
    }
  }

  /**
   * Fetch documentation for a specific node
   *
   * @param nodeType - The type of node to fetch documentation for
   * @returns Node documentation object
   */
  async fetchNodeDocumentation(
    nodeType: string
  ): Promise<NodeDocumentation | null> {
    try {
      // Check if we have a cached version
      const cachedDoc = await this.getFromCache(nodeType);
      if (cachedDoc) {
        return cachedDoc;
      }

      // Extract node prefix
      const parts = nodeType.split(".");
      const prefix = parts[0];

      // Generate possible URL patterns to try
      const possibleUrls: string[] = [];

      // Add the primary URL based on our best guess
      possibleUrls.push(this.getDocumentationUrl(nodeType));

      // Add alternative URLs based on different patterns
      if (prefix === "n8n-nodes-base") {
        possibleUrls.push(`${this.baseUrl}core-nodes/${nodeType}/`);
        possibleUrls.push(`${this.baseUrl}app-nodes/${nodeType}/`);
        possibleUrls.push(`${this.baseUrl}trigger-nodes/${nodeType}/`);
        possibleUrls.push(
          `${this.baseUrl}cluster-nodes/root-nodes/${nodeType}/`
        );
      } else if (prefix === "n8n-nodes-langchain") {
        possibleUrls.push(
          `${this.baseUrl}cluster-nodes/root-nodes/${nodeType}/`
        );
        possibleUrls.push(
          `${this.baseUrl}cluster-nodes/sub-nodes/${nodeType}/`
        );
      }

      // Try each URL until we find one that works
      let html: string | null = null;
      let successfulUrl: string | null = null;

      for (const url of possibleUrls) {
        try {
          console.log(`Trying URL: ${url}`);
          const response = await axios.get(url);
          if (response.status === 200) {
            html = response.data;
            successfulUrl = url;
            console.log(`Successfully fetched documentation from: ${url}`);
            break;
          }
        } catch (error) {
          console.log(
            `URL ${url} failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      if (!html || !successfulUrl) {
        console.error(
          `Could not fetch documentation for ${nodeType} from any URL`
        );
        return null;
      }

      // Parse the HTML to extract documentation
      const doc = this.parseDocumentation(nodeType, html, successfulUrl);

      // Cache the documentation
      await this.saveToCache(nodeType, doc);

      return doc;
    } catch (error) {
      console.error(`Error fetching documentation for ${nodeType}:`, error);
      return null;
    }
  }

  /**
   * Parse HTML documentation into structured format
   *
   * @param nodeType - The type of node
   * @param html - The HTML content of the documentation page
   * @param sourceUrl - The URL where the documentation was fetched from
   * @returns Structured node documentation
   */
  private parseDocumentation(
    nodeType: string,
    html: string,
    sourceUrl: string
  ): NodeDocumentation {
    const $ = cheerio.load(html);

    // Extract basic information
    const displayName =
      $("h1").first().text().trim() ||
      this.getDisplayNameFromNodeType(nodeType);

    // Get the main description - usually the first paragraph after the title
    let description = "";
    $("h1")
      .first()
      .next("p")
      .each((_, element) => {
        description += $(element).text().trim() + " ";
      });

    if (!description) {
      // Try alternative selectors if the first approach didn't work
      description = $("main p").first().text().trim();
    }

    // Extract version information if available
    let version = "1.0";
    $("p:contains('Version')").each((_, element) => {
      const versionText = $(element).text().trim();
      const versionMatch = versionText.match(/Version\s*:\s*([0-9.]+)/i);
      if (versionMatch && versionMatch[1]) {
        version = versionMatch[1];
      }
    });

    // Extract parameters
    const parameters: ParameterDocumentation[] = [];

    // Look for parameter tables
    $("table").each((_, table) => {
      const tableHeading = $(table).prev("h2, h3, h4").text().toLowerCase();
      if (
        tableHeading.includes("parameter") ||
        tableHeading.includes("option") ||
        tableHeading.includes("setting")
      ) {
        // Process the table rows
        $(table)
          .find("tbody tr")
          .each((_, row) => {
            const cells = $(row).find("td");
            if (cells.length >= 2) {
              const name = $(cells[0]).text().trim();
              const description = $(cells[1]).text().trim();

              // Try to determine if parameter is required
              const isRequired =
                description.toLowerCase().includes("required") ||
                $(cells[0]).text().includes("*");

              // Try to determine the type
              let type = "string";
              if (cells.length >= 3) {
                type = $(cells[2]).text().trim() || "string";
              }

              // Add the parameter
              parameters.push({
                name,
                type,
                description,
                required: isRequired,
              });
            }
          });
      }
    });

    // If no parameters found in tables, look for lists
    if (parameters.length === 0) {
      $("h3:contains('Parameters'), h2:contains('Parameters')")
        .next("ul")
        .find("li")
        .each((_, element) => {
          const text = $(element).text().trim();
          const nameMatch = text.match(/^([^:]+):/);
          if (nameMatch && nameMatch[1]) {
            const name = nameMatch[1].trim();
            const description = text.substring(nameMatch[0].length).trim();

            // Try to determine if parameter is required
            const isRequired = description.toLowerCase().includes("required");

            // Try to determine the type
            let type = "string";
            if (text.includes("(number)")) type = "number";
            if (text.includes("(boolean)")) type = "boolean";
            if (text.includes("(array)")) type = "array";
            if (text.includes("(object)")) type = "object";

            // Add the parameter
            parameters.push({
              name,
              type,
              description,
              required: isRequired,
            });
          }
        });
    }

    // Extract examples
    const examples: Example[] = [];

    // Look for example sections
    $("h2:contains('Example'), h3:contains('Example')").each((_, heading) => {
      const title = $(heading).text().trim();
      let description = "";

      // Get the description from paragraphs following the heading
      $(heading)
        .nextUntil("h2, h3, pre")
        .filter("p")
        .each((_, element) => {
          description += $(element).text().trim() + " ";
        });

      // Get the code example if available
      let code = "";
      const codeBlock = $(heading).nextAll("pre").first();
      if (codeBlock.length > 0) {
        code = $(codeBlock).text().trim();
      }

      examples.push({
        title,
        description: description.trim(),
        code: code || undefined,
      });
    });

    // Create the documentation object
    const doc: NodeDocumentation = {
      nodeType,
      displayName,
      description: description.trim(),
      version,
      parameters,
      examples,
      sourceUrl,
      fetchedAt: new Date(),
    };

    return doc;
  }

  /**
   * Get a display name from a node type
   *
   * @param nodeType - The node type (e.g., "n8n-nodes-base.gmail")
   * @returns A formatted display name (e.g., "Gmail")
   */
  private getDisplayNameFromNodeType(nodeType: string): string {
    // Extract the last part of the node type (after the last dot)
    const namePart = nodeType.split(".").pop() || nodeType;

    // Convert to title case and handle special cases
    return namePart
      .replace(/([A-Z])/g, " $1") // Add spaces before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .replace(/Api/g, "API") // Handle common acronyms
      .replace(/Oauth/g, "OAuth")
      .replace(/Smtp/g, "SMTP")
      .trim();
  }

  /**
   * Get the URL for a node's documentation
   *
   * @param nodeType - The type of node
   * @returns The URL for the node's documentation
   */
  private getDocumentationUrl(nodeType: string): string {
    // Extract node prefix and name from the node type
    const [prefix, nodeName] = nodeType.split(".");

    // Check the node prefix to determine the URL pattern
    if (prefix === "n8n-nodes-langchain") {
      // First check if it's a root node or sub-node
      const rootNodes = [
        "agent",
        "chainllm",
        "chainretrievalqa",
        "chainsummarization",
        "information-extractor",
        "text-classifier",
        "sentimentanalysis",
        "code",
        "vectorstoreinmemory",
        "vectorstoremilvus",
        "vectorstoremongodbatlas",
        "vectorstorepgvector",
        "vectorstorepinecone",
        "vectorstoreqdrant",
        "vectorstoresupabase",
        "vectorstorezep",
        "lmchatopenai",
        "lmchatollama",
        "embeddingsopenai",
        "chattrigger",
        "mcptrigger",
      ];

      if (
        rootNodes.includes(nodeName) ||
        rootNodes.some((name) => nodeName.toLowerCase() === name.toLowerCase())
      ) {
        return `${this.baseUrl}cluster-nodes/root-nodes/${nodeType}/`;
      } else {
        // Assume it's a sub-node
        return `${this.baseUrl}cluster-nodes/sub-nodes/${nodeType}/`;
      }
    }

    // For n8n-nodes-base prefix, determine the category
    if (prefix === "n8n-nodes-base") {
      // Check if it's a trigger node (ends with 'Trigger')
      if (nodeName.toLowerCase().endsWith("trigger")) {
        return `${this.baseUrl}trigger-nodes/${nodeType}/`;
      }

      // Check if it's a well-known app integration
      const appNodeNames = [
        "gmail",
        "slack",
        "airtable",
        "googleSheets",
        "dropbox",
        "github",
        "githubTrigger",
        "jira",
        "notion",
        "trello",
        "asana",
        "twitter",
        "telegram",
        "discord",
        "stripe",
        "salesforce",
        "shopify",
        "zendesk",
        "zoom",
        "hubspot",
      ];

      if (
        appNodeNames.includes(nodeName) ||
        appNodeNames.some((name) =>
          nodeName.toLowerCase().includes(name.toLowerCase())
        )
      ) {
        return `${this.baseUrl}app-nodes/${nodeType}/`;
      }

      // Default to core nodes
      return `${this.baseUrl}core-nodes/${nodeType}/`;
    }

    // Default URL pattern for unknown prefixes
    return `${this.baseUrl}core-nodes/${nodeType}/`;
  }

  /**
   * Get documentation from cache
   *
   * @param nodeType - The type of node
   * @returns Cached documentation or null if not found
   */
  private async getFromCache(
    nodeType: string
  ): Promise<NodeDocumentation | null> {
    try {
      const cacheFile = path.join(this.cacheDir, `${nodeType}.json`);
      const data = await fs.readFile(cacheFile, "utf8");
      return JSON.parse(data) as NodeDocumentation;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Save documentation to cache
   *
   * @param nodeType - The type of node
   * @param doc - The documentation to cache
   */
  private async saveToCache(
    nodeType: string,
    doc: NodeDocumentation
  ): Promise<void> {
    const cacheFile = path.join(this.cacheDir, `${nodeType}.json`);
    await fs.writeFile(cacheFile, JSON.stringify(doc, null, 2), "utf8");
  }
}

// Example usage
async function main() {
  const fetcher = new DocFetcher();
  await fetcher.initialize();

  // Fetch documentation for a specific node
  const httpRequestDoc = await fetcher.fetchNodeDocumentation(
    "n8n-nodes-base.httpRequest"
  );
  console.log("HTTP Request documentation:", httpRequestDoc);

  // Fetch all nodes (placeholder)
  const allDocs = await fetcher.fetchAllNodes();
  console.log(`Fetched documentation for ${allDocs.length} nodes`);
}

// Run the example if this file is executed directly
// In ES modules, we can check if this is the main module by comparing import.meta.url
// against the resolved path of the current file
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
