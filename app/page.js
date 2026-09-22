
import ChatInterface from "../components/ChatInterface";
import MenuBook from "../components/icons/MenuBook";
import Search from "../components/icons/Search";
import SmartToy from "../components/icons/SmartToy";
import Settings from "../components/icons/Settings";
import Palette from "../components/icons/Palette";
import SyncAlt from "../components/icons/SyncAlt";
import Stars from "../components/icons/Stars";

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">
              RAG Chatbot
            </h1>

            <p className="opacity-90">
              Retrieval-Augmented Generation with Ollama + pgvector
            </p>
          </div>

          {/* Chat Interface */}
          <div className="glass-card rounded-lg flex flex-col overflow-hidden h-[700px]">
            <ChatInterface />
          </div>

          {/* Info Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MenuBook className="w-5 h-5" />
                Knowledge Base
              </h3>

              <p className="text-sm opacity-80">
                Upload documents to build your custom knowledge base
              </p>
            </div>

            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Smart Search
              </h3>

              <p className="text-sm opacity-80">
                Vector similarity search finds relevant context
              </p>
            </div>

            <div className="glass-card rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <SmartToy className="w-5 h-5" />
                AI Responses
              </h3>

              <p className="text-sm opacity-80">
                Llama 3.2 generates answers using your documents
              </p>
            </div>
          </div>

          {/* Tech Stack & Architecture */}
          <div className="mt-6 glass-card rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Tech Stack & Architecture
            </h2>

            {/* Tech Stack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Backend */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Backend
                </h3>

                <ul className="space-y-2 text-sm opacity-90">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Next.js 16</strong> - Server-side API routes
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Neon PostgreSQL + pgvector</strong> -
                      Vector database for semantic search
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Ollama</strong> -
                      Local AI model inference
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>nomic-embed-text</strong> -
                      Text embeddings with 768 dimensions
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Llama 3.2</strong> -
                      Local language model for response generation
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>PDF/TXT Processing</strong> -
                      Document text extraction
                    </span>
                  </li>
                </ul>
              </div>

              {/* Frontend */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Frontend
                </h3>

                <ul className="space-y-2 text-sm opacity-90">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>React 19</strong> - Modern UI with hooks
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Tailwind CSS</strong> -
                      Responsive styling and dark mode
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Session-Based Retrieval</strong> -
                      Retrieve documents by session
                    </span>
                  </li>

                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>PDF/TXT Support</strong> -
                      Upload and process documents
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Data Flow */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SyncAlt className="w-5 h-5" />
                Data Flow
              </h3>

              {/* Upload Flow */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 opacity-90">
                  Document Upload Flow:
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {[
                    "PDF/TXT Upload",
                    "Extract Text",
                    "Chunk Text",
                    "Generate Embeddings (Ollama)",
                    "Store in Neon PostgreSQL",
                  ].map((step, index, steps) => (
                    <span key={step} className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded font-medium bg-indigo-900/60 border border-indigo-700/50">
                        {step}
                      </div>

                      {index < steps.length - 1 && (
                        <span className="opacity-60">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Query Flow */}
              <div>
                <h4 className="text-sm font-semibold mb-3 opacity-90">
                  Query Flow:
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {[
                    "User Question",
                    "Generate Query Embedding",
                    "Vector Search (pgvector)",
                    "Retrieve Top 3 Chunks",
                    "Llama 3.2 + Context",
                    "AI Response",
                  ].map((step, index, steps) => (
                    <span key={step} className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded font-medium bg-indigo-900/60 border border-indigo-700/50">
                        {step}
                      </div>

                      {index < steps.length - 1 && (
                        <span className="opacity-60">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Stars className="w-5 h-5" />
                Key Technical Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm opacity-90">
                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Vector Search:</strong>{" "}
                    Semantic similarity search using pgvector
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Local AI Inference:</strong>{" "}
                    Ollama for embeddings and response generation
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Cosine Distance:</strong>{" "}
                    pgvector &lt;=&gt; operator
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Source Citations:</strong>{" "}
                    Track retrieved documents and chunks
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Session-Based Search:</strong>{" "}
                    Retrieve relevant chunks from a session
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>
                    <strong>Query History:</strong>{" "}
                    Store questions and response metrics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}