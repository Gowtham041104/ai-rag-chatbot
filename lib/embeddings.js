
/**
 * Ollama Embeddings Utility
 *
 * Generates embeddings locally using nomic-embed-text.
 * No OpenAI API key or billing required.
 */

const OLLAMA_URL = 'http://localhost:11434';

const EMBEDDING_MODEL = 'nomic-embed-text';

/**
 * Generate embedding for a single text chunk
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */

export async function generateEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for embedding');
    }

    const response = await fetch(
      `${OLLAMA_URL}/api/embeddings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama embedding error: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error(
        'Ollama returned an invalid embedding'
      );
    }

    return data.embedding;

  } catch (error) {
    console.error(
      '[Embeddings] Error generating embedding:',
      error.message
    );

    throw error;
  }
}

/**
 * Generate embeddings for multiple text chunks
 *
 * @param {string[]} texts - Array of text chunks
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */

export async function generateEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error(
        'Text array is required for embeddings'
      );
    }

    console.log(
      `[Embeddings] Processing ${texts.length} chunks`
    );

    const embeddings = [];

    for (let i = 0; i < texts.length; i++) {
      console.log(
        `[Embeddings] Processing chunk ${i + 1}/${texts.length}`
      );

      const embedding = await generateEmbedding(
        texts[i]
      );

      embeddings.push(embedding);
    }

    console.log(
      '[Embeddings] Successfully generated embeddings'
    );

    console.log(
      `[Embeddings] Vector dimension: ${embeddings[0].length}`
    );

    return embeddings;

  } catch (error) {
    console.error(
      '[Embeddings] Actual error:',
      error.message
    );

    throw new Error(
      `Failed to generate embeddings: ${error.message}`
    );
  }
}

/**
 * Calculate cosine similarity between two vectors
 *
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} - Similarity score
 */

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(
      'Vectors must have the same dimension'
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}