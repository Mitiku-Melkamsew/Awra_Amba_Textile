-- Split users.full_name into first_name (NOT NULL) and last_name (NULL)
ALTER TABLE "users" ADD COLUMN "first_name" VARCHAR(60);
ALTER TABLE "users" ADD COLUMN "last_name" VARCHAR(60);

UPDATE "users"
SET
  "first_name" = COALESCE(NULLIF(SPLIT_PART(TRIM("full_name"), ' ', 1), ''), "username"),
  "last_name" = CASE
    WHEN POSITION(' ' IN TRIM("full_name")) > 0
      THEN NULLIF(TRIM(SUBSTRING(TRIM("full_name") FROM POSITION(' ' IN TRIM("full_name")) + 1)), '')
    ELSE NULL
  END
WHERE "first_name" IS NULL;

ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" DROP COLUMN "full_name";
