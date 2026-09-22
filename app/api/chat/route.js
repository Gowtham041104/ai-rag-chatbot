import { getDB } from "../../../lib/db.js";
import { generateEmbedding } from "../../../lib/embeddings.js";

/**
 * POST /api/chat
 *
 * RAG Query Endpoint
 *
 * Flow:
 * 1. User asks a question
 * 2. Generate embedding using Ollama
 * 3. Search relevant chunks in PostgreSQL
 * 4. Build context
 * 5. Generate answer using local Ollama model
 * 6. Log query and response
 * 7. Return response with sources
 */

export async function POST(req) {
  const startTime = Date.now();

  try {
    // Get request data
    const { query, sessionId } = await req.json();

    // Validate query
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Query is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Validate session ID
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Session ID is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(`[Chat] Query from session ${sessionId}:`, query);

    // --------------------------------------------------
    // STEP 1: Generate query embedding using Ollama
    // --------------------------------------------------

    console.log("[Chat] Generating query embedding...");

    const queryEmbeddingStart = Date.now();

    const queryEmbedding = await generateEmbedding(query);

    const queryEmbeddingTime = Date.now() - queryEmbeddingStart;

    console.log(`[Chat] Query embedding generated in ${queryEmbeddingTime}ms`);

    // --------------------------------------------------
    // STEP 2: Search relevant chunks using pgvector
    // --------------------------------------------------

    console.log("[Chat] Searching for relevant chunks...");

    const retrievalStart = Date.now();

    const db = getDB();

    const queryResult = await db`
  SELECT
    c.id,
    c.content,
    c.document_id,
    d.name AS document_name,
    1 - (c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector)
      AS similarity
  FROM chunks c
  JOIN documents d
    ON c.document_id = d.id
  WHERE d.session_id = ${sessionId}
  ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
  LIMIT 3
`;

    const results = Array.isArray(queryResult)
      ? queryResult
      : Array.isArray(queryResult.rows)
        ? queryResult.rows
        : [];

    console.log("[Chat] Query result type:", typeof queryResult);
    console.log("[Chat] Results is array:", Array.isArray(results));

    const retrievalTime = Date.now() - retrievalStart;

    console.log(
      `[Chat] Found ${results.length} relevant chunks in ${retrievalTime}ms`,
    );

    // --------------------------------------------------
    // If no documents are found
    // --------------------------------------------------

    if (results.length === 0) {
      return new Response(
        JSON.stringify({
          response:
            "I don't have enough information to answer that question. Please upload documents first.",
          sources: [],
          metadata: {
            retrievalTime,
            generationTime: 0,
            totalTime: Date.now() - startTime,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------
    // STEP 3: Build context from retrieved chunks
    // --------------------------------------------------

    const context = results
      .map(
        (result, index) =>
          `[${index + 1}] From "${result.document_name}":\n${result.content}`,
      )
      .join("\n\n---\n\n");

    console.log("[Chat] Context built from", results.length, "chunks");

    // --------------------------------------------------
    // STEP 4: Create prompts
    // --------------------------------------------------

    const systemPrompt = `
You are a concise AI assistant that answers questions
based only on the provided context.

Instructions:
- Use the provided context to answer the question.
- Keep answers brief and clear.
- Answer in 2-3 sentences unless more detail is required.
- Cite sources using [1], [2], and so on.
- If the context does not contain the answer, say that
  you do not have enough information.
- Do not invent information.
`;

    const userPrompt = `
Context from documents:

${context}

---

Question:
${query}

Answer briefly using only the context above.
Cite sources using [1], [2], and so on.
`;

    // --------------------------------------------------
    // STEP 5: Generate response using local Ollama
    // --------------------------------------------------

    console.log("[Chat] Generating response with Ollama...");

    const generationStart = Date.now();

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        stream: false,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        options: {
          temperature: 0.3,
          num_predict: 150,
        },
      }),
    });

    // Check Ollama response
    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      throw new Error(
        `Ollama chat error: ${ollamaResponse.status} ${errorText}`,
      );
    }

    const ollamaData = await ollamaResponse.json();

    const response = ollamaData.message?.content;

    if (!response) {
      throw new Error("Ollama returned an empty response");
    }

    const generationTime = Date.now() - generationStart;

    const totalTime = Date.now() - startTime;

    console.log(
      `[Chat] Response generated in ${generationTime}ms (total: ${totalTime}ms)`,
    );

    // --------------------------------------------------
    // STEP 6: Log query history
    // --------------------------------------------------

    const chunkIds = results.map((result) => result.id);

    await db`
      INSERT INTO query_history (
        query,
        response,
        retrieved_chunks,
        retrieval_time_ms,
        generation_time_ms,
        total_time_ms
      )
      VALUES (
        ${query},
        ${response},
        ${chunkIds},
        ${retrievalTime},
        ${generationTime},
        ${totalTime}
      )
    `;

    // --------------------------------------------------
    // STEP 7: Return response with sources
    // --------------------------------------------------

    const sources = results.map((result, index) => ({
      index: index + 1,
      documentName: result.document_name,
      documentId: result.document_id,
      similarity: Number(Number(result.similarity).toFixed(3)),
      preview:
        result.content.substring(0, 150) +
        (result.content.length > 150 ? "..." : ""),
    }));

    return new Response(
      JSON.stringify({
        response,
        sources,
        metadata: {
          retrievalTime,
          generationTime,
          totalTime,
          chunksRetrieved: results.length,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[Chat] Error processing query:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process query",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
