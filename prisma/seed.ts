import 'dotenv/config';
import {PrismaClient} from '@/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

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
