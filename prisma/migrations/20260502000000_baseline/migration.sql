-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMISSIONS_STAFF', 'ACADEMIC_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('ENQUIRY', 'VISIT_INVITED', 'INTERVIEW_APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'DECLINED', 'WITHDRAWN', 'REGISTRATION_FORM_RECEIVED', 'DOCUMENTS_COMPLETE', 'CONFIRMED_ORDINAND');

-- CreateEnum
CREATE TYPE "BAPStageStatus" AS ENUM ('COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('EXPLORATORY_VISIT', 'VISIT_INTERVIEW');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('REQUIRED', 'NOT_REQUIRED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewOutcome" AS ENUM ('RECOMMENDED', 'NOT_RECOMMENDED', 'DEFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('CONDITIONAL', 'UNCONDITIONAL', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('SINGLE', 'FAMILY');

-- CreateEnum
CREATE TYPE "AccommodationDuration" AS ENUM ('TERM_TIME', 'FULL_YEAR');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('REQUIRED', 'RECEIVED', 'OUTSTANDING', 'WAIVED');

-- CreateEnum
CREATE TYPE "AwardingFramework" AS ENUM ('COMMON_AWARDS', 'OXFORD');

-- CreateEnum
CREATE TYPE "ModeOfStudy" AS ENUM ('FULL_TIME', 'PART_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'OFFER_DECISION', 'DOCUMENT_RECEIVED', 'DOCUMENT_WAIVED', 'INTERVIEW_OUTCOME', 'INTERVIEW_SCHEDULED', 'INVITATION_SENT', 'APPLICATION_RECEIVED', 'CONFIRMED_ORDINAND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMISSIONS_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

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
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "addressLineOne" TEXT,
    "addressLineTwo" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'ENQUIRY',
    "hasStageOneBAPException" BOOLEAN NOT NULL DEFAULT false,
    "stageOneBAPExceptionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "admissionsYearId" TEXT,
    "programmeId" TEXT,
    "dioceseId" TEXT,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcclesialProfile" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "directorOfOrdinandsName" TEXT,
    "directorOfOrdinandsEmail" TEXT,
    "directorOfOrdinandsPhone" TEXT,
    "sponsoringBishopName" TEXT,
    "sponsoringBishopEmail" TEXT,
    "sponsoringBishopPhone" TEXT,
    "dioceseId" TEXT,

    CONSTRAINT "EcclesialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BAPStatus" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "stageOneStatus" "BAPStageStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stageOneDate" TIMESTAMP(3),
    "hasStageOneBAPException" BOOLEAN NOT NULL DEFAULT false,
    "stageOneBAPExceptionReason" TEXT,
    "stageTwoStatus" "BAPStageStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stageTwoDate" TIMESTAMP(3),

    CONSTRAINT "BAPStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgramme" (
    "id" TEXT NOT NULL,
    "awardingFramework" "AwardingFramework" NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "durationOfStudy" TEXT,
    "modeOfStudy" "ModeOfStudy" NOT NULL DEFAULT 'FULL_TIME',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "invitationSentAt" TIMESTAMP(3),
    "invitationSentByUserId" TEXT,
    "interviewApplicationReceivedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "InterviewStatus" NOT NULL DEFAULT 'REQUIRED',
    "outcome" "InterviewOutcome",
    "notes" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "followUpActions" TEXT,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPanel" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "offerType" "OfferType" NOT NULL,
    "decisionDate" TIMESTAMP(3),
    "conditions" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "registrationFormReceivedAt" TIMESTAMP(3),
    "contactDetailsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "programmeConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "bishopDetailsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "areSupportingDocumentsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "electronicSignature" BOOLEAN NOT NULL DEFAULT false,
    "confirmedOrdinandAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantDocument" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "documentTypeId" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3),
    "storageProvider" TEXT,
    "storageUrl" TEXT,
    "fileName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationRequest" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "isAccommodationRequired" BOOLEAN NOT NULL DEFAULT false,
    "accommodationType" "AccommodationType",
    "duration" "AccommodationDuration",
    "familyUnitSize" INTEGER,
    "totalAccommodationDemand" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "performedByUserId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diocese" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diocese_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionsYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionsYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_applicantId_key" ON "Applicant"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "EcclesialProfile_applicantId_key" ON "EcclesialProfile"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "BAPStatus_applicantId_key" ON "BAPStatus"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPanel_interviewId_userId_key" ON "InterviewPanel"("interviewId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_applicantId_key" ON "Offer"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_applicantId_key" ON "Registration"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationRequest_applicantId_key" ON "AccommodationRequest"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Diocese_name_key" ON "Diocese"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionsYear_label_key" ON "AdmissionsYear"("label");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_admissionsYearId_fkey" FOREIGN KEY ("admissionsYearId") REFERENCES "AdmissionsYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "AcademicProgramme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_dioceseId_fkey" FOREIGN KEY ("dioceseId") REFERENCES "Diocese"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcclesialProfile" ADD CONSTRAINT "EcclesialProfile_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcclesialProfile" ADD CONSTRAINT "EcclesialProfile_dioceseId_fkey" FOREIGN KEY ("dioceseId") REFERENCES "Diocese"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BAPStatus" ADD CONSTRAINT "BAPStatus_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_invitationSentByUserId_fkey" FOREIGN KEY ("invitationSentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDocument" ADD CONSTRAINT "ApplicantDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantDocument" ADD CONSTRAINT "ApplicantDocument_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationRequest" ADD CONSTRAINT "AccommodationRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

