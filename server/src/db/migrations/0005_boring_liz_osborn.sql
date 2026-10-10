CREATE INDEX "chat_sessions_user_updated_idx" ON "chat_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "document_chunks_session_idx" ON "document_chunks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "documents_session_created_idx" ON "documents" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_session_created_idx" ON "messages" USING btree ("session_id","created_at");--> statement-breakpoint
UPDATE "document_chunks"
SET "page_number" = ("metadata" #>> '{loc,pageNumber}')::integer
WHERE ("metadata" #>> '{loc,pageNumber}') ~ '^[0-9]+$'
  AND ("metadata" #>> '{loc,pageNumber}')::integer >= 1
  AND "page_number" = ("metadata" #>> '{loc,pageNumber}')::integer + 1;
