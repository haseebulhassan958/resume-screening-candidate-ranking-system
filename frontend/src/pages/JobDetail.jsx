import { useEffect, useState } from "react";
import { getJobById } from "../services/api";
import Spinner from "../components/Spinner";
import PageWrapper from "../components/PageWrapper";

function JobDetail({ jobId, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await getJobById(jobId);
        setJob(res.data);
      } catch (err) {
        console.error("Failed to load job:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId]);

  if (loading) return <Spinner message="Loading job description..." />;
  if (!job) return <p className="text-text-lo text-sm">Job not found.</p>;

  return (
    <PageWrapper>
    <div>
      <button
        onClick={onBack}
        className="text-sm font-semibold text-text-lo hover:text-text-hi transition-colors duration-150 mb-5"
      >
        ← Back to Job Descriptions
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Header card */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gold-soft flex items-center justify-center text-2xl flex-shrink-0">
                💼
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold text-text-hi">
                  {job.title}
                </h1>
                <div className="flex gap-4 mt-2 text-xs text-text-lo font-medium">
                  <span>
                    🕐{" "}
                    {job.min_experience_years
                      ? `${job.min_experience_years}+ years experience`
                      : "Experience not specified"}
                  </span>
                  <span>
                    🎓{" "}
                    {job.education_requirement || "Education not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Description */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-3">
              Full Job Description
            </h3>
            <p className="text-sm text-text-lo whitespace-pre-line leading-relaxed">
              {job.raw_description}
            </p>
          </div>
        </div>

        {/* Right: structured requirements */}
        <div className="flex flex-col gap-5">

          {/* Structured Requirements */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-4">
              Structured Requirements
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 py-2.5 border-b border-border-soft">
                <span className="text-[10px] font-bold text-text-lo uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
                  Experience
                </span>
                <span className="text-xs font-bold text-text-hi">
                  {job.min_experience_years
                    ? `${job.min_experience_years}+ years`
                    : "Not specified"}
                </span>
              </div>
              <div className="flex items-start gap-3 py-2.5">
                <span className="text-[10px] font-bold text-text-lo uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
                  Education
                </span>
                <span className="text-xs font-bold text-text-hi">
                  {job.education_requirement || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-4">
              Required Skills
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {job.required_skills ? (
                job.required_skills.split(",").map((skill) => (
                  <span
                    key={skill}
                    className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-forest/8 text-forest"
                  >
                    {skill.trim()}
                  </span>
                ))
              ) : (
                <p className="text-xs text-text-lo">No required skills specified.</p>
              )}
            </div>
          </div>

          {/* Preferred Skills */}
          {job.preferred_skills && (
            <div className="bg-white border border-border-soft rounded-2xl p-6">
              <h3 className="font-heading text-base font-bold text-text-hi mb-4">
                Preferred Skills
              </h3>
              <div className="flex gap-1.5 flex-wrap">
                {job.preferred_skills.split(",").map((skill) => (
                  <span
                    key={skill}
                    className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-gold-soft text-status-amber"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
   </PageWrapper>
  );
}

export default JobDetail;