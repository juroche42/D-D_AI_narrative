-- Index ivfflat pour la recherche de similarité cosinus sur les embeddings pgvector.
-- lists=100 est adapté à un dataset de ~10 000 documents (règle : sqrt(nb_rows)).
-- Augmenter lists si le dataset dépasse 100 000 documents.
CREATE INDEX "vector_documents_embedding_idx"
  ON "vector_documents"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
