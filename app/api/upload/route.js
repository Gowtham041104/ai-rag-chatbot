import { getDB } from "../../../lib/db.js";
import { generateEmbeddings } from "../../../lib/embeddings.js";
import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(getData());

function splitText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end >= text.length) break;

    start += chunkSize - overlap;
  }

  return chunks;
}

export async function POST(req) {
  try {
    const { fileData, fileName, fileSize, fileType, sessionId } =
      await req.json();

    if (!fileData || !fileName || !sessionId) {
      return Response.json(
        { error: "File data, file name, and session ID are required" },
        { status: 400 },
      );
    }

    console.log(`[Upload] Processing file: ${fileName}`);

    // Convert Base64 to Buffer
    const fileBuffer = Buffer.from(fileData, "base64");

    let text = "";

    // Extract text from PDF
    if (
      fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      const parser = new PDFParse({ data: fileBuffer });

      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (
      fileType === "text/plain" ||
      fileName.toLowerCase().endsWith(".txt")
    ) {
      text = fileBuffer.toString("utf-8");
    } else {
      return Response.json(
        { error: "Only PDF and TXT files are supported" },
        { status: 400 },
      );
    }

    text = text.trim();

    if (!text) {
      return Response.json(
        { error: "No readable text found in the file" },
        { status: 400 },
      );
    }

    // Split text into chunks
    const chunks = splitText(text);

    console.log(`[Upload] Created ${chunks.length} chunks`);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    if (!embeddings || embeddings.length !== chunks.length) {
      throw new Error("Embedding count does not match chunk count");
    }

    if (embeddings[0].length !== 768) {
      throw new Error(
        `Expected 768 dimensions, received ${embeddings[0].length}`,
      );
    }

    const db = getDB();

    // Insert document metadata
    const documentResult = await db`
      INSERT INTO documents (
        name,
        file_type,
        file_size,
        session_id,
        chunk_count,
        metadata
      )
      VALUES (
        ${fileName},
        ${fileType || "unknown"},
        ${fileSize || fileBuffer.length},
        ${sessionId},
        ${chunks.length},
        ${JSON.stringify({ originalName: fileName })}
      )
      RETURNING id, name, chunk_count
    `;

    const document = documentResult.rows[0];

    // Insert chunks and embeddings
    for (let i = 0; i < chunks.length; i++) {
      const embedding = `[${embeddings[i].join(",")}]`;

      await db`
        INSERT INTO chunks (
          document_id,
          chunk_index,
          content,
          token_count,
          embedding
        )
        VALUES (
          ${document.id},
          ${i},
          ${chunks[i]},
          ${Math.ceil(chunks[i].length / 4)},
          ${embedding}::vector
        )
      `;
    }

    console.log(`[Upload] Successfully saved ${chunks.length} chunks`);

    return Response.json(
      {
        message: "Document uploaded successfully",
        document: {
          id: document.id,
          name: document.name,
          chunkCount: chunks.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Upload] Error processing file:", error);

    return Response.json(
      {
        error: "Failed to upload document",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
