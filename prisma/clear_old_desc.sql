UPDATE "BusinessPage" SET "coverSubtitle" = NULL, "slogan" = NULL WHERE LENGTH(COALESCE("coverSubtitle",'')) < 60 OR "slogan" IS NOT NULL;
