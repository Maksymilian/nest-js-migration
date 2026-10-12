--liquibase formatted sql

--changeset training-progress:0003-telegram-chats
--comment: One row per signed-in Telegram chat: the private chat's id and the member it's signed in as. Signing out deletes the row.
CREATE TABLE telegram_chats (
  chat_id bigint PRIMARY KEY,
  member_id text NOT NULL,
  signed_in_at timestamp with time zone NOT NULL
);
--rollback DROP TABLE telegram_chats;
