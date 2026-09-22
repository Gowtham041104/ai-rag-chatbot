
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { sql } = await import('@vercel/postgres');

async function initDatabase() {
  try {
    console.log('🔧 Initializing RAG Chatbot database...\n');

    // Enable pgvector
    console.log('📦 Enabling pgvector extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('✅ pgvector enabled\n');

    // Create documents table
    console.log('📄 Creating documents table...');

    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        blob_url TEXT,
        session_id TEXT,
        upload_date TIMESTAMP DEFAULT NOW(),
        chunk_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add session_id if the table already existed
    await sql`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS session_id TEXT
    `;

    console.log('✅ Documents table created\n');

    // IMPORTANT:
    // Ollama nomic-embed-text normally returns 768 dimensions.
    // Existing chunks must be recreated if they use vector(1536).

    console.log('📝 Creating chunks table...');

    await sql`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER,
        embedding vector(768),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Chunks table created\n');

    // Create indexes
    console.log('🔍 Creating indexes...');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_chunks_document_id
      ON chunks(document_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_documents_session_id
      ON documents(session_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding
      ON chunks
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `;

    console.log('✅ Indexes created\n');

    // Create query history table
    console.log('📊 Creating query_history table...');

    await sql`
      CREATE TABLE IF NOT EXISTS query_history (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        retrieved_chunks INTEGER[],
        retrieval_time_ms INTEGER,
        generation_time_ms INTEGER,
        total_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_query_history_created_at
      ON query_history(created_at DESC)
    `;

    console.log('✅ Query history table created\n');

    // Create update trigger
    console.log('⚙️ Creating update trigger...');

    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_documents_updated_at
      ON documents
    `;

    await sql`
      CREATE TRIGGER update_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Update trigger created\n');

    // Create document statistics view
    console.log('📈 Creating document_stats view...');

    await sql`
      CREATE OR REPLACE VIEW document_stats AS
      SELECT
        d.id,
        d.name,
        d.file_type,
        d.chunk_count,
        COUNT(c.id) AS actual_chunks,
        SUM(c.token_count) AS total_tokens,
        d.upload_date,
        d.updated_at
      FROM documents d
      LEFT JOIN chunks c ON d.id = c.document_id
      GROUP BY
        d.id,
        d.name,
        d.file_type,
        d.chunk_count,
        d.upload_date,
        d.updated_at
      ORDER BY d.upload_date DESC
    `;

    console.log('✅ Document_stats view created\n');

    // Verify setup
    console.log('🔍 Verifying setup...');

    const versionResult = await sql`
      SELECT extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    console.log(
      `✅ pgvector version: ${
        versionResult.rows[0]?.extversion || 'unknown'
      }`
    );

    const tableResult = await sql`
      SELECT COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    console.log(
      `✅ Tables created: ${
        tableResult.rows[0]?.table_count || 0
      }`
    );

    console.log('\n🎉 Database initialization complete!');
    console.log('\nEmbedding dimension: 768');
    console.log('Embedding model: nomic-embed-text');
    console.log('Chat model: llama3.2');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();