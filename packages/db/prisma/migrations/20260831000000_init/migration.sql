-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('PASS', 'FAIL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TraceEventKind" AS ENUM ('TOOL_CALL', 'TOOL_RESULT', 'ASSISTANT_MESSAGE', 'SKILL_TRIGGER', 'SESSION_END');

-- CreateEnum
CREATE TYPE "SessionOutcome" AS ENUM ('COMPLETED', 'ABORTED', 'ERROR');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Suite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPromptHash" TEXT NOT NULL,
    "activeSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Suite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "expectTriggered" BOOLEAN,
    "notTriggered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assertions" JSONB NOT NULL DEFAULT '[]',
    "nearNeighbour" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3) NOT NULL,
    "host" TEXT NOT NULL,
    "pinSkillSource" TEXT NOT NULL,
    "pinSkillHash" TEXT NOT NULL,
    "pinModel" TEXT NOT NULL,
    "pinSystemPromptHash" TEXT NOT NULL,
    "pinSuiteVersion" INTEGER NOT NULL,
    "pinSuiteHash" TEXT NOT NULL,
    "runsPerCase" INTEGER NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "unknownReason" TEXT,
    "uploadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "unknown" INTEGER NOT NULL,
    "rateSuccesses" INTEGER NOT NULL,
    "rateN" INTEGER NOT NULL,
    "rateValue" DOUBLE PRECISION,
    "ciLow" DOUBLE PRECISION,
    "ciHigh" DOUBLE PRECISION,
    "expectTriggered" BOOLEAN,

    CONSTRAINT "CaseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "caseResultId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3) NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "reason" TEXT NOT NULL,
    "triggerAvailable" BOOLEAN NOT NULL,
    "triggerTriggered" BOOLEAN,
    "triggerComplete" BOOLEAN,
    "triggerVia" TEXT,
    "triggerReason" TEXT,
    "triggerSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costUsd" DECIMAL(12,6),

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" "TraceEventKind" NOT NULL,
    "at" TIMESTAMPTZ(3),
    "callId" TEXT,
    "callRef" TEXT,
    "tool" TEXT,
    "args" JSONB,
    "isError" BOOLEAN,
    "error" TEXT,
    "text" TEXT,
    "acknowledgesError" BOOLEAN,
    "skill" TEXT,
    "outcome" "SessionOutcome",

    CONSTRAINT "TraceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvDiff" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "writes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deletes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "network" JSONB NOT NULL DEFAULT '[]',
    "unobserved" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "EnvDiff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssertionResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "assertion" JSONB NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" JSONB,

    CONSTRAINT "AssertionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMPTZ(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "suspendedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Suite_ownerId_updatedAt_idx" ON "Suite"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Suite_skill_version_hash_key" ON "Suite"("skill", "version", "hash");

-- CreateIndex
CREATE INDEX "Case_suiteId_expectTriggered_idx" ON "Case"("suiteId", "expectTriggered");

-- CreateIndex
CREATE UNIQUE INDEX "Case_suiteId_caseId_key" ON "Case"("suiteId", "caseId");

-- CreateIndex
CREATE INDEX "Run_suiteId_startedAt_idx" ON "Run"("suiteId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "Run_ownerId_uploadedAt_idx" ON "Run"("ownerId", "uploadedAt" DESC);

-- CreateIndex
CREATE INDEX "Run_verdict_idx" ON "Run"("verdict");

-- CreateIndex
CREATE UNIQUE INDEX "CaseResult_runId_caseId_key" ON "CaseResult"("runId", "caseId");

-- CreateIndex
CREATE INDEX "Attempt_verdict_idx" ON "Attempt"("verdict");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_caseResultId_index_key" ON "Attempt"("caseResultId", "index");

-- CreateIndex
CREATE INDEX "TraceEvent_attemptId_kind_idx" ON "TraceEvent"("attemptId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "TraceEvent_attemptId_seq_key" ON "TraceEvent"("attemptId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "EnvDiff_attemptId_key" ON "EnvDiff"("attemptId");

-- CreateIndex
CREATE INDEX "AssertionResult_attemptId_verdict_idx" ON "AssertionResult"("attemptId", "verdict");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_userId_revokedAt_idx" ON "ApiToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Suite" ADD CONSTRAINT "Suite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "Suite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "Suite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResult" ADD CONSTRAINT "CaseResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResult" ADD CONSTRAINT "CaseResult_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_caseResultId_fkey" FOREIGN KEY ("caseResultId") REFERENCES "CaseResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvDiff" ADD CONSTRAINT "EnvDiff_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssertionResult" ADD CONSTRAINT "AssertionResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Değişmezler — veritabanı seviyesinde
--
-- Uygulama katmanı hata yapabilir; CHECK kısıtı yapamaz. Aşağıdaki her kısıt
-- docs/invariants.md'deki bir kuralın karşılığıdır ve
-- packages/db/src/constraints.test.ts içinde gerçek bir Postgres üzerinde
-- ihlal denenerek kanıtlanır.
-- ---------------------------------------------------------------------------

-- #1 — `unknown` bir verdict gerekçesiz olamaz.
ALTER TABLE "Run"
  ADD CONSTRAINT "run_unknown_needs_reason"
  CHECK ("verdict" <> 'UNKNOWN' OR ("unknownReason" IS NOT NULL AND btrim("unknownReason") <> ''));

ALTER TABLE "Attempt"
  ADD CONSTRAINT "attempt_unknown_needs_reason"
  CHECK ("verdict" <> 'UNKNOWN' OR btrim("reason") <> '');

ALTER TABLE "AssertionResult"
  ADD CONSTRAINT "assertion_unknown_needs_reason"
  CHECK ("verdict" <> 'UNKNOWN' OR btrim("reason") <> '');

-- #1 — Okunamayan tetiklenme sinyali "tetiklenmedi" gibi saklanamaz.
-- Sinyal okunduysa `triggered` ve `complete` doludur; okunamadıysa ikisi de
-- boştur ve neden yazılıdır. Arada bir durum yok.
ALTER TABLE "Attempt"
  ADD CONSTRAINT "attempt_trigger_shape"
  CHECK (
    ("triggerAvailable" = true
      AND "triggerTriggered" IS NOT NULL
      AND "triggerComplete" IS NOT NULL
      AND "triggerVia" IS NOT NULL)
    OR
    ("triggerAvailable" = false
      AND "triggerTriggered" IS NULL
      AND "triggerComplete" IS NULL
      AND "triggerReason" IS NOT NULL
      AND btrim("triggerReason") <> '')
  );

-- #2 — Dört pin ve iki denetçisi boş olamaz.
ALTER TABLE "Run"
  ADD CONSTRAINT "run_pins_present"
  CHECK (
    btrim("pinSkillSource") <> ''
    AND btrim("pinSkillHash") <> ''
    AND btrim("pinModel") <> ''
    AND btrim("pinSystemPromptHash") <> ''
    AND btrim("pinSuiteHash") <> ''
    AND "pinSuiteVersion" > 0
  );

-- #3 — Tekrar sayısı en az 1; koşum kaydı sıfır tekrarla var olamaz.
-- Not: varsayılanın asla 1 olmaması bir CLI kuralı; burada saklanan şey
-- kullanıcının bilerek seçtiği değer olabilir, o yüzden alt sınır 1.
ALTER TABLE "Run"
  ADD CONSTRAINT "run_repeat_positive"
  CHECK ("runsPerCase" >= 1);

-- #4 — Oran, N ve güven aralığından ayrılamaz.
-- N = 0 iken oran da aralık da yoktur; N > 0 iken üçü de vardır.
ALTER TABLE "CaseResult"
  ADD CONSTRAINT "caseresult_rate_needs_n_and_ci"
  CHECK (
    ("rateN" = 0 AND "rateValue" IS NULL AND "ciLow" IS NULL AND "ciHigh" IS NULL)
    OR
    ("rateN" > 0
      AND "rateValue" IS NOT NULL
      AND "ciLow" IS NOT NULL
      AND "ciHigh" IS NOT NULL
      AND "rateValue" BETWEEN 0 AND 1
      AND "ciLow" BETWEEN 0 AND 1
      AND "ciHigh" BETWEEN 0 AND 1
      AND "ciLow" <= "ciHigh")
  );

-- Sayımlar tutarlı olmalı: N, kesin sonuçların toplamıdır.
ALTER TABLE "CaseResult"
  ADD CONSTRAINT "caseresult_counts_agree"
  CHECK (
    "passed" >= 0 AND "failed" >= 0 AND "unknown" >= 0
    AND "rateSuccesses" = "passed"
    AND "rateN" = "passed" + "failed"
  );

-- #5'in yarısı: bir vaka en az bir şey ölçmelidir. Tetiklenme iddiası,
-- coexistence iddiası veya assertion'lardan biri olmalı.
-- Not: `array_length('{}', 1)` NULL döner ve `NULL > 0` da NULL'dur; Postgres
-- NULL sonuçlu bir CHECK'i ihlal saymaz. coalesce olmadan bu kısıt sessizce
-- boşa çıkıyordu — test yakaladı.
ALTER TABLE "Case"
  ADD CONSTRAINT "case_measures_something"
  CHECK (
    "expectTriggered" IS NOT NULL
    OR coalesce(array_length("notTriggered", 1), 0) > 0
    OR coalesce(jsonb_array_length("assertions"), 0) > 0
  );

-- Vaka kimliği hiyerarşik ve küçük harf olmalı — kayıtlar eşleşebilsin diye.
ALTER TABLE "Case"
  ADD CONSTRAINT "case_id_hierarchical"
  CHECK ("caseId" ~ '^[a-z0-9]+(\.[a-z0-9_]+)+$');

-- Bir attempt'in başlangıcı bitişinden sonra olamaz.
ALTER TABLE "Attempt"
  ADD CONSTRAINT "attempt_time_ordered"
  CHECK ("finishedAt" >= "startedAt");

ALTER TABLE "Run"
  ADD CONSTRAINT "run_time_ordered"
  CHECK ("finishedAt" >= "startedAt");

-- Maliyet negatif olamaz.
ALTER TABLE "Attempt"
  ADD CONSTRAINT "attempt_cost_non_negative"
  CHECK (
    ("costUsd" IS NULL OR "costUsd" >= 0)
    AND ("inputTokens" IS NULL OR "inputTokens" >= 0)
    AND ("outputTokens" IS NULL OR "outputTokens" >= 0)
    AND ("latencyMs" IS NULL OR "latencyMs" >= 0)
  );
