-- CreateTable
CREATE TABLE "vector_documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "chunk" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "vector_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vector_documents_type_idx" ON "vector_documents"("type");
