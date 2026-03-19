-- CreateIndex
CREATE INDEX "TrendingProduct_addedById_idx" ON "TrendingProduct"("addedById");

-- CreateIndex
CREATE INDEX "TrendingProductRequest_requestId_idx" ON "TrendingProductRequest"("requestId");

-- AddForeignKey
ALTER TABLE "TrendingProduct" ADD CONSTRAINT "TrendingProduct_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingProductRequest" ADD CONSTRAINT "TrendingProductRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingProductRequest" ADD CONSTRAINT "TrendingProductRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultingRequest" ADD CONSTRAINT "ConsultingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
