import 'dotenv/config';
import {PrismaClient} from '@/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {DOCUMENT_TYPES} from '@/features/documents/constants/document-types';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEV_USERS = [
  {
    name: 'Alice Admissions',
    email: 'alice@ssh-dev.local',
    role: 'ADMISSIONS_STAFF' as const,
  },
  {
    name: 'Bob Academic',
    email: 'bob@ssh-dev.local',
    role: 'ACADEMIC_STAFF' as const,
  },
  {
    name: 'Carol Leadership',
    email: 'carol@ssh-dev.local',
    role: 'SENIOR_LEADERSHIP' as const,
  },
  {
    name: 'Dave Admin',
    email: 'dave@ssh-dev.local',
    role: 'SYSTEM_ADMINISTRATOR' as const,
  },
];

async function main() {
  console.log('🌱 Seeding dev users...\n');

  for (const user of DEV_USERS) {
    const result = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true },
      create: { name: user.name, email: user.email, role: user.role, isActive: true },
    });
    console.log(`  ✓ ${result.role.padEnd(22)} → ${result.email} (${result.name})`);
  }

  // ─── Reference Data ──────────────────────────────────────────────────────

  console.log('\n🌱 Seeding reference data...\n');

  // Admissions Years
  const year2025 = await prisma.admissionsYear.upsert({
    where: { label: '2025-2026' },
    update: {},
    create: {
      label: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      isCurrent: true,
      isActive: true,
    },
  });
  const year2026 = await prisma.admissionsYear.upsert({
    where: { label: '2026-2027' },
    update: {},
    create: {
      label: '2026-2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-08-31'),
      isCurrent: false,
      isActive: true,
    },
  });
  console.log('  ✓ Admissions years: 2025-2026 (current), 2026-2027');

  // Dioceses
  const dioceseNames = ['Oxford', 'London', 'Canterbury', 'York', 'Durham', 'Chelmsford'];
  const dioceses: Record<string, { id: string }> = {};
  for (const name of dioceseNames) {
    dioceses[name] = await prisma.diocese.upsert({
      where: {name},
      update: {},
      create: {name, isActive: true},
    });
  }
  console.log(`  ✓ Dioceses: ${dioceseNames.join(', ')}`);

  // Academic Programmes
  const programmes = [
    { courseTitle: 'BA in Theology', awardingFramework: 'COMMON_AWARDS' as const, modeOfStudy: 'FULL_TIME' as const },
    { courseTitle: 'MA in Applied Theology', awardingFramework: 'COMMON_AWARDS' as const, modeOfStudy: 'FULL_TIME' as const },
    { courseTitle: 'PGDip in Theology', awardingFramework: 'COMMON_AWARDS' as const, modeOfStudy: 'PART_TIME' as const },
    { courseTitle: 'Certificate in Theology', awardingFramework: 'OXFORD' as const, modeOfStudy: 'FULL_TIME' as const },
  ];
  const programmeRecords: Record<string, { id: string }> = {};
  for (const p of programmes) {
    const existing = await prisma.academicProgramme.findFirst({ where: { courseTitle: p.courseTitle } });
    if (existing) {
      programmeRecords[p.courseTitle] = existing;
    } else {
      programmeRecords[p.courseTitle] = await prisma.academicProgramme.create({data: p});
    }
  }
  console.log(`  ✓ Programmes: ${programmes.map((p) => p.courseTitle).join(', ')}`);

  // Document Types
  const documentTypeRecords: Record<string, { id: string }> = {};
  for (const dt of DOCUMENT_TYPES) {
    documentTypeRecords[dt.slug] = await prisma.documentType.upsert({
      where: {slug: dt.slug},
      update: {name: dt.name, isSensitive: dt.isSensitive, isRequired: dt.isRequired, isActive: true},
      create: {name: dt.name, slug: dt.slug, isSensitive: dt.isSensitive, isRequired: dt.isRequired, isActive: true},
    });
  }
  console.log(`  ✓ Document types: ${DOCUMENT_TYPES.length} types seeded`);

  // ─── Sample Applicants ───────────────────────────────────────────────────

  console.log('\n🌱 Seeding sample applicants...\n');

  const sampleApplicants = [
    {
      applicantId: 'SSH-2025-0001',
      legalName: 'James Smith',
      preferredName: 'Jim',
      email: 'james.smith@example.com',
      phone: '+44 7700 900001',
      status: 'ENQUIRY' as const,
      diocese: 'Oxford',
      programme: 'BA in Theology',
      bapStageOne: 'INCOMPLETE' as const,
    },
    {
      applicantId: 'SSH-2025-0002',
      legalName: 'Amita Patel',
      email: 'amita.patel@example.com',
      phone: '+44 7700 900002',
      status: 'VISIT_INVITED' as const,
      diocese: 'London',
      programme: 'MA in Applied Theology',
      bapStageOne: 'SCHEDULED' as const,
    },
    {
      applicantId: 'SSH-2025-0003',
      legalName: 'Michael Johnson',
      preferredName: 'Mike',
      email: 'michael.j@example.com',
      status: 'INTERVIEW_SCHEDULED' as const,
      diocese: 'Canterbury',
      programme: 'BA in Theology',
      bapStageOne: 'COMPLETED' as const,
    },
    {
      applicantId: 'SSH-2025-0004',
      legalName: 'Sarah Williams',
      email: 'sarah.w@example.com',
      status: 'CONDITIONAL_OFFER' as const,
      diocese: 'York',
      programme: 'PGDip in Theology',
      bapStageOne: 'COMPLETED' as const,
    },
    {
      applicantId: 'SSH-2025-0005',
      legalName: 'David Brown',
      email: 'david.b@example.com',
      status: 'CONFIRMED_ORDINAND' as const,
      diocese: 'Durham',
      programme: 'Certificate in Theology',
      bapStageOne: 'COMPLETED' as const,
    },
    {
      applicantId: 'SSH-2025-0006',
      legalName: 'Emily Clarke',
      email: 'emily.c@example.com',
      status: 'WITHDRAWN' as const,
      diocese: 'Chelmsford',
      programme: 'BA in Theology',
      bapStageOne: 'INCOMPLETE' as const,
    },
    {
      applicantId: 'SSH-2025-0007',
      legalName: 'Rachel Green',
      preferredName: 'Rach',
      email: 'rachel.g@example.com',
      status: 'INTERVIEW_COMPLETED' as const,
      diocese: 'Oxford',
      programme: 'MA in Applied Theology',
      bapStageOne: 'COMPLETED' as const,
    },
    {
      applicantId: 'SSH-2025-0008',
      legalName: 'Thomas Hughes',
      preferredName: 'Tom',
      email: 'thomas.h@example.com',
      status: 'UNCONDITIONAL_OFFER' as const,
      diocese: 'London',
      programme: 'BA in Theology',
      bapStageOne: 'COMPLETED' as const,
    },
  ];

  for (const a of sampleApplicants) {
    const existing = await prisma.applicant.findFirst({ where: { applicantId: a.applicantId } });
    if (existing) {
      console.log(`  ⊘ ${a.applicantId} already exists, skipping`);
      continue;
    }

    const applicant = await prisma.applicant.create({
      data: {
        applicantId: a.applicantId,
        legalName: a.legalName,
        preferredName: a.preferredName ?? null,
        email: a.email,
        phone: a.phone ?? null,
        status: a.status,
        admissionsYearId: year2025.id,
        programmeId: programmeRecords[a.programme].id,
        dioceseId: dioceses[a.diocese].id,
      },
    });

    await prisma.bAPStatus.create({
      data: {
        applicantId: applicant.id,
        stageOneStatus: a.bapStageOne,
        stageOneDate: a.bapStageOne === 'COMPLETED' ? new Date('2025-01-15') : null,
      },
    });

    console.log(`  ✓ ${a.applicantId} — ${a.legalName} (${a.status})`);
  }

  // ─── Sample Interviews ──────────────────────────────────────────────────

  console.log('\n🌱 Seeding sample interviews...\n');

  // Find Michael Johnson (INTERVIEW_SCHEDULED) and Bob Academic (interviewer)
  const michaelApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0003' },
  });
  const bobUser = await prisma.user.findFirst({
    where: { email: 'bob@ssh-dev.local' },
  });
  const aliceUser = await prisma.user.findFirst({
    where: { email: 'alice@ssh-dev.local' },
  });

  if (michaelApplicant && bobUser && aliceUser) {
    const existingInterview = await prisma.interview.findFirst({
      where: { applicantId: michaelApplicant.id },
    });

    if (!existingInterview) {
      const interview = await prisma.interview.create({
        data: {
          applicantId: michaelApplicant.id,
          interviewType: 'VISIT_INTERVIEW',
          scheduledAt: new Date('2025-07-20T10:00:00Z'),
          status: 'SCHEDULED',
          invitationSentAt: new Date('2025-06-15T09:00:00Z'),
          invitationSentByUserId: aliceUser.id,
          createdByUserId: aliceUser.id,
        },
      });

      await prisma.interviewPanel.create({
        data: {
          interviewId: interview.id,
          userId: bobUser.id,
        },
      });

      console.log(`  ✓ Interview for ${michaelApplicant.applicantId} — Visit-Interview on 20 Jul 2025, panel: Bob Academic`);
    } else {
      console.log(`  ⊘ Interview for ${michaelApplicant.applicantId} already exists, skipping`);
    }
  }

  // ─── F04 E2E: Completed interview for Rachel Green ──────────────────────

  const rachelApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0007' },
  });

  if (rachelApplicant && aliceUser) {
    const existingRachelInterview = await prisma.interview.findFirst({
      where: { applicantId: rachelApplicant.id },
    });

    if (!existingRachelInterview) {
      await prisma.interview.create({
        data: {
          applicantId: rachelApplicant.id,
          interviewType: 'VISIT_INTERVIEW',
          scheduledAt: new Date('2025-06-10T14:00:00Z'),
          status: 'COMPLETED',
          outcome: 'RECOMMENDED',
          notes: 'Strong candidate, recommended for unconditional offer.',
          createdByUserId: aliceUser.id,
        },
      });
      console.log(`  ✓ Completed interview for ${rachelApplicant.applicantId} — Rachel Green`);
    } else {
      console.log(`  ⊘ Interview for ${rachelApplicant.applicantId} already exists, skipping`);
    }
  }

  // ─── F04 UI Demo: Unaccepted offer for Thomas Hughes ────────────────────

  const thomasApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0008' },
  });

  if (thomasApplicant) {
    const existingOffer = await prisma.offer.findFirst({
      where: { applicantId: thomasApplicant.id },
    });

    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          applicantId: thomasApplicant.id,
          offerType: 'UNCONDITIONAL',
          decisionDate: new Date('2026-04-15'),
          conditions: [],
          decisionNotes: 'Strong candidate across all areas. Recommended unanimously by panel.',
        },
      });
      console.log(`  ✓ Unaccepted unconditional offer created for ${thomasApplicant.applicantId} — Thomas Hughes`);
    } else {
      console.log(`  ⊘ Offer for ${thomasApplicant.applicantId} already exists, skipping`);
    }
  }

  // ─── F05 E2E: Applicant with mixed document states ──────────────────────

  console.log('\n🌱 Seeding F05 document management data...\n');

  const sophieApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0009' },
  });

  let sophieId: string;
  if (!sophieApplicant) {
    const sophie = await prisma.applicant.create({
      data: {
        applicantId: 'SSH-2025-0009',
        legalName:   'Sophie Turner',
        preferredName: 'Sophie',
        email:       'sophie.t@example.com',
        status:      'CONDITIONAL_OFFER',
        admissionsYearId: year2025.id,
        programmeId:     programmeRecords['BA in Theology'].id,
        dioceseId:       dioceses['London'].id,
        sharePointFolderUrl: 'https://sharepoint.example.com/sites/admissions/SSH-2025-0009',
      },
    });
    sophieId = sophie.id;
    await prisma.bAPStatus.create({
      data: { applicantId: sophieId, stageOneStatus: 'COMPLETED', stageOneDate: new Date('2025-02-01') },
    });
    console.log('  ✓ SSH-2025-0009 — Sophie Turner (CONDITIONAL_OFFER)');
  } else {
    sophieId = sophieApplicant.id;
    console.log('  ⊘ SSH-2025-0009 already exists, skipping applicant create');
  }

  // Seed sample documents for Sophie
  const dtGcse    = documentTypeRecords['GCSE_TRANSCRIPT'];
  const dtAlevel  = documentTypeRecords['A_LEVEL_TRANSCRIPT'];
  const dtUndergrad = documentTypeRecords['UNDERGRAD_TRANSCRIPT'];
  const dtLegalId = documentTypeRecords['LEGAL_ID'];
  const dtDbs     = documentTypeRecords['DBS_CHECK'];

  if (dtGcse && dtAlevel && dtUndergrad && dtLegalId && dtDbs) {
    // GCSE: RECEIVED
    await prisma.applicantDocument.upsert({
      where:  { applicantId_documentTypeId: { applicantId: sophieId, documentTypeId: dtGcse.id } },
      update: {},
      create: { applicantId: sophieId, documentTypeId: dtGcse.id, isRequired: true, isReceived: true, receivedAt: new Date('2025-06-12'), fileName: 'gcse_transcript.pdf', storageProvider: 'SHAREPOINT', storageUrl: 'https://sharepoint.example.com/sites/admissions/SSH-2025-0009/gcse_transcript.pdf' },
    });
    // A-Level: RECEIVED
    await prisma.applicantDocument.upsert({
      where:  { applicantId_documentTypeId: { applicantId: sophieId, documentTypeId: dtAlevel.id } },
      update: {},
      create: { applicantId: sophieId, documentTypeId: dtAlevel.id, isRequired: true, isReceived: true, receivedAt: new Date('2025-06-12'), fileName: 'alevel_transcript.pdf', storageProvider: 'SHAREPOINT', storageUrl: 'https://sharepoint.example.com/sites/admissions/SSH-2025-0009/alevel_transcript.pdf' },
    });
    // Undergrad: WAIVED
    await prisma.applicantDocument.upsert({
      where:  { applicantId_documentTypeId: { applicantId: sophieId, documentTypeId: dtUndergrad.id } },
      update: {},
      create: { applicantId: sophieId, documentTypeId: dtUndergrad.id, isRequired: true, isReceived: false, isWaived: true, waiverNote: 'Applicant entered directly via A-levels; no undergraduate degree required for this programme.' },
    });
    // Legal ID: OUTSTANDING (sensitive — no record)
    // DBS Check: OUTSTANDING (sensitive — no record)
    console.log('  ✓ Sample documents for Sophie Turner: GCSE/A-Level received, Undergrad waived, others outstanding');
  }

  // ─── F07 Dashboard: Accommodation Requests ─────────────────────────────

  console.log('\n🌱 Seeding F07 accommodation data...\n');

  const davidApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0005' },
  });
  const sarahApplicant = await prisma.applicant.findFirst({
    where: { applicantId: 'SSH-2025-0004' },
  });

  if (davidApplicant) {
    await prisma.accommodationRequest.upsert({
      where: { applicantId: davidApplicant.id },
      update: {},
      create: {
        applicantId: davidApplicant.id,
        isAccommodationRequired: true,
        accommodationType: 'SINGLE',
        duration: 'FULL_YEAR',
      },
    });
    console.log('  ✓ Accommodation: David Brown — Single, Full-year');
  }

  if (sarahApplicant) {
    await prisma.accommodationRequest.upsert({
      where: { applicantId: sarahApplicant.id },
      update: {},
      create: {
        applicantId: sarahApplicant.id,
        isAccommodationRequired: true,
        accommodationType: 'FAMILY',
        duration: 'TERM_TIME',
        familyUnitSize: 3,
      },
    });
    console.log('  ✓ Accommodation: Sarah Williams — Family (3), Term-time');
  }

  if (thomasApplicant) {
    await prisma.accommodationRequest.upsert({
      where: { applicantId: thomasApplicant.id },
      update: {},
      create: {
        applicantId: thomasApplicant.id,
        isAccommodationRequired: true,
        accommodationType: 'SINGLE',
        duration: 'TERM_TIME',
      },
    });
    console.log('  ✓ Accommodation: Thomas Hughes — Single, Term-time');
  }

  console.log('\n✅ Seed complete. Dev login available at /dev/login\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
