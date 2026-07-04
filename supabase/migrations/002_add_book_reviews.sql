alter table user_books
add column if not exists rating int check (rating >= 1 and rating <= 5),
add column if not exists review text;
