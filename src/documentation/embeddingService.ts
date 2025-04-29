/**
 * Local Embedding Service for n8n Documentation
 *
 * This module provides functionality to generate vector embeddings locally
 * for node documentation without relying on external APIs.
 */

/**
 * Interface for embedding generation service
 */
export interface EmbeddingService {
  /**
   * Generate embeddings for a text
   * 
   * @param text - The text to generate embeddings for
   * @returns A vector of numerical values representing the text
   */
  generateEmbedding(text: string): Promise<number[]>;
  
  /**
   * Generate embeddings for multiple texts in batch
   * 
   * @param texts - Array of texts to generate embeddings for
   * @returns Array of vectors, one for each input text
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * Simple local embedding service using term frequency
 * 
 * This is a basic implementation that creates embeddings based on word frequency.
 * It's not as sophisticated as machine learning models but works without external dependencies.
 */
export class LocalEmbeddingService implements EmbeddingService {
  private vocabulary: Map<string, number>;
  private vectorSize: number;
  private initialized: boolean = false;
  
  /**
   * Create a new LocalEmbeddingService
   * 
   * @param vectorSize - The size of the embedding vectors to generate
   */
  constructor(vectorSize: number = 512) {
    this.vocabulary = new Map<string, number>();
    this.vectorSize = vectorSize;
  }
  
  /**
   * Initialize the embedding service with a vocabulary
   * 
   * @param texts - Array of texts to build the vocabulary from
   */
  async initialize(texts: string[] = []): Promise<void> {
    if (this.initialized && texts.length === 0) {
      return;
    }
    
    // Reset vocabulary
    this.vocabulary.clear();
    
    // Process all texts to build vocabulary
    for (const text of texts) {
      const tokens = this.tokenize(text);
      for (const token of tokens) {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, this.vocabulary.size);
        }
      }
    }
    
    this.initialized = true;
    console.log(`Embedding service initialized with vocabulary size: ${this.vocabulary.size}`);
  }
  
  /**
   * Generate embedding for a single text
   * 
   * @param text - The text to generate embedding for
   * @returns A vector representation of the text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize([text]);
    }
    
    // Create a zero-filled vector
    const vector = new Array(this.vectorSize).fill(0);
    
    // Tokenize the text
    const tokens = this.tokenize(text);
    
    // Create a frequency map for this text
    const frequencies = new Map<string, number>();
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    }
    
    // Fill the vector with frequencies
    for (const [token, frequency] of frequencies.entries()) {
      const index = this.getTokenIndex(token);
      if (index !== null && index < this.vectorSize) {
        vector[index] = frequency / tokens.length; // Normalize by text length
      }
    }
    
    // Normalize the vector to unit length
    return this.normalizeVector(vector);
  }
  
  /**
   * Generate embeddings for multiple texts
   * 
   * @param texts - Array of texts to generate embeddings for
   * @returns Array of vectors, one for each input text
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.initialized) {
      await this.initialize(texts);
    }
    
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text));
    }
    
    return embeddings;
  }
  
  /**
   * Get the similarity between two vectors
   * 
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Cosine similarity between the vectors (-1 to 1)
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0; // Handle zero vectors
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  /**
   * Tokenize a text into words
   * 
   * @param text - The text to tokenize
   * @returns Array of tokens (words)
   */
  private tokenize(text: string): string[] {
    // Convert to lowercase and replace non-alphanumeric characters with spaces
    const cleanedText = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    
    // Split by whitespace and filter out empty strings and common stopwords
    const tokens = cleanedText.split(/\s+/).filter(token => 
      token.length > 0 && !this.isStopword(token)
    );
    
    return tokens;
  }
  
  /**
   * Get the index for a token in the vocabulary
   * 
   * @param token - The token to look up
   * @returns The token's index or null if not in vocabulary
   */
  private getTokenIndex(token: string): number | null {
    // If token exists in vocabulary, return its index
    if (this.vocabulary.has(token)) {
      return this.vocabulary.get(token)!;
    }
    
    // If we have room in the vector, add the token
    if (this.vocabulary.size < this.vectorSize) {
      const newIndex = this.vocabulary.size;
      this.vocabulary.set(token, newIndex);
      return newIndex;
    }
    
    // Otherwise, hash the token to an existing index
    return this.hashToken(token) % this.vectorSize;
  }
  
  /**
   * Generate a hash for a token
   * 
   * @param token - The token to hash
   * @returns A numerical hash for the token
   */
  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Normalize a vector to unit length
   * 
   * @param vector - The vector to normalize
   * @returns Normalized vector
   */
  private normalizeVector(vector: number[]): number[] {
    // Calculate magnitude
    let magnitude = 0;
    for (const value of vector) {
      magnitude += value * value;
    }
    magnitude = Math.sqrt(magnitude);
    
    // Avoid division by zero
    if (magnitude === 0) {
      return vector;
    }
    
    // Normalize
    return vector.map(value => value / magnitude);
  }
  
  /**
   * Check if a word is a common stopword
   * 
   * @param word - The word to check
   * @returns True if the word is a stopword
   */
  private isStopword(word: string): boolean {
    const stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'as', 'at', 'by', 'for',
      'to', 'in', 'of', 'on', 'is', 'it', 'this', 'that', 'with', 'from',
      'be', 'am', 'are', 'was', 'were', 'has', 'have', 'had'
    ]);
    
    return stopwords.has(word);
  }
}

// Example usage
async function main() {
  // Create a new embedding service
  const embeddingService = new LocalEmbeddingService(64);
  
  // Example texts
  const texts = [
    "The Gmail node is used to access and manage emails in Gmail.",
    "Slack node allows sending messages to channels and users.",
    "HTTP Request node can make API calls to external services."
  ];
  
  // Initialize with example texts
  await embeddingService.initialize(texts);
  
  // Generate embeddings
  const embeddings = await embeddingService.generateEmbeddings(texts);
  
  // Calculate similarities
  const sim1_2 = LocalEmbeddingService.cosineSimilarity(embeddings[0], embeddings[1]);
  const sim1_3 = LocalEmbeddingService.cosineSimilarity(embeddings[0], embeddings[2]);
  const sim2_3 = LocalEmbeddingService.cosineSimilarity(embeddings[1], embeddings[2]);
  
  console.log("Similarity between Gmail and Slack:", sim1_2);
  console.log("Similarity between Gmail and HTTP Request:", sim1_3);
  console.log("Similarity between Slack and HTTP Request:", sim2_3);
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
