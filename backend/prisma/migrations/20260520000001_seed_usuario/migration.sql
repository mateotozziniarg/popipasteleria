INSERT INTO "Usuario" ("username", "passwordHash", "updatedAt")
VALUES ('Popi', '$2b$12$dLg3OeqKr2GgYSpTN8bR9OPsAOcDGr14XreMF65X9tuIHhbdBdo0O', NOW())
ON CONFLICT ("username") DO NOTHING;
