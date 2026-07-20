ALTER TABLE favorite_books DROP CONSTRAINT IF EXISTS favorite_books_rank_check;
ALTER TABLE favorite_books ADD CONSTRAINT favorite_books_rank_check CHECK (rank between 1 and 10);
