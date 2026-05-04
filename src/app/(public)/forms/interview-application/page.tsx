import { getReferenceData } from '@/lib/queries/applicants';
import { InterviewApplicationForm } from '@/components/forms/interview-application-form';

export const metadata = {
  title: "Interview Application \u2014 St Stephen\u2019s House",
  description: "Apply for an interview at St Stephen\u2019s House, Oxford.",
};

export default async function InterviewApplicationPage() {
  const { programmes, dioceses } = await getReferenceData();

  return (
    <InterviewApplicationForm
      dioceses={dioceses.map((d) => ({ id: d.id, name: d.name }))}
      programmes={programmes.map((p) => ({ id: p.id, courseTitle: p.courseTitle }))}
    />
  );
}
