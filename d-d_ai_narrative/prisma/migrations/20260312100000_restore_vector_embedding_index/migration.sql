-- Restaure l'index ivfflat supprimé par la migration précédente (add_game_state_narrative_entry).
-- Nécessaire pour les recherches RAG par similarité cosinus (US-06-02).
CREATE INDEX IF NOT EXISTS "vector_documents_embedding_idx"
  ON "vector_documents"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
