import { useEffect, useState } from "react";
import {
  getCandidateById,
  getJobs,
  scoreCandidate,
  getMatchDetails,
  getSkillGap,
  getInterviewQuestions,
} from "../services/api";
import ScoreRing from "../components/ScoreRing";
import ScoreBar from "../components/ScoreBar";
import SkillTag from "../components/SkillTag";
import VerdictBadge from "../components/VerdictBadge";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

function CandidateProfile({ candidateId, onBack }) {
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [matchDetails, setMatchDetails] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skillGap, setSkillGap] = useState(null);
  const [interviewQs, setInterviewQs] = useState(null);
  const [loadingBonus, setLoadingBonus] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [candidateRes, jobsRes] = await Promise.all([
          getCandidateById(candidateId),
          getJobs(),
        ]);
        setCandidate(candidateRes.data);
        setJobs(jobsRes.data);
      } catch (err) {
        console.error("Failed to load candidate profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [candidateId]);

  async function handleEvaluate() {
    if (!selectedJobId) return;
    setScoring(true);
    setSkillGap(null);
    setInterviewQs(null);

    try {
      await scoreCandidate(candidateId, selectedJobId);

      const [matchRes, gapRes, interviewRes] = await Promise.all([
        getMatchDetails(candidateId, selectedJobId),
        getSkillGap(candidateId, selectedJobId),
        getInterviewQuestions(candidateId, selectedJobId),
      ]);

      setMatchDetails(matchRes.data);
      setSkillGap(gapRes.data);
      setInterviewQs(interviewRes.data);
    } catch (err) {
      console.error("Scoring failed:", err);
    } finally {
      setScoring(false);
    }
  }

  if (loading) return <Spinner message="Loading candidate profile..." />;
  if (!candidate) return (
    <EmptyState
      icon="🔍"
      title="Candidate not found"
      description="This candidate may have been deleted."
    />
  );

  const skillList = candidate.skills
    ? candidate.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm font-semibold text-text-lo hover:text-text-hi transition-colors duration-150 mb-5"
      >
        ← Back to Candidates
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: candidate info */}
        <div className="col-span-2 flex flex-col gap-5">
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Avatar name={candidate.name} size="lg" />
              <div>
                <h1 className="font-heading text-xl font-bold text-text-hi">
                  {candidate.name || "Unnamed Candidate"}
                </h1>
                <div className="text-sm text-text-lo mt-1">{candidate.email}</div>
                <div className="text-sm text-text-lo">{candidate.phone}</div>
              </div>
            </div>

            {candidate.ai_summary && (
                <div className="mt-5 pt-5 border-t border-border-soft">
                    <div className="text-[10px] font-bold text-gold uppercase tracking-wide mb-2">
                        AI Summary
                    </div>
                    <p className="text-sm text-text-hi leading-relaxed">{candidate.ai_summary}</p>
                    </div>
            )}
          </div>

          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-4">Skills</h3>
            <div className="flex gap-2 flex-wrap">
              {skillList.length > 0 ? (
                skillList.map((skill) => <SkillTag key={skill} skill={skill} />)
              ) : (
                <p className="text-text-lo text-sm">No skills extracted.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-3">Education</h3>
            <p className="text-sm text-text-lo whitespace-pre-line">
              {candidate.education || "Not specified."}
            </p>
          </div>

          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-3">
              Work Experience
            </h3>
            <p className="text-sm text-text-lo whitespace-pre-line">
              {candidate.work_experience || "Not specified."}
            </p>
          </div>

          {candidate.projects && (
            <div className="bg-white border border-border-soft rounded-2xl p-6">
              <h3 className="font-heading text-base font-bold text-text-hi mb-3">
                Projects
              </h3>
              <p className="text-sm text-text-lo whitespace-pre-line">
                {candidate.projects}
              </p>
            </div>
          )}

          {candidate.certifications && (
            <div className="bg-white border border-border-soft rounded-2xl p-6">
              <h3 className="font-heading text-base font-bold text-text-hi mb-3">
                Certifications
              </h3>
              <p className="text-sm text-text-lo whitespace-pre-line">
                {candidate.certifications}
              </p>
            </div>
          )}
        </div>

        {/* Right: AI evaluation */}
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-4">
              Evaluate Against a Job
            </h3>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border-soft text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="">Select a job...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleEvaluate}
              disabled={scoring || !selectedJobId}
              className="w-full mt-3 bg-forest text-white px-4 py-2.5 rounded-xl text-sm font-bold font-heading hover:bg-forest-light transition-colors duration-200 disabled:opacity-50"
            >
              {scoring ? "Evaluating..." : "Evaluate"}
            </button>
          </div>

          {matchDetails && (
            <>
              <div className="bg-white border border-border-soft rounded-2xl p-6 text-center">
                <ScoreRing score={matchDetails.scores.overall_score} size={110} />
                <div className="mt-4">
                  <VerdictBadge verdict={matchDetails.verdict} />
                </div>
              </div>

              <div className="bg-white border border-border-soft rounded-2xl p-6">
                <h3 className="font-heading text-base font-bold text-text-hi mb-4">
                  Score Breakdown
                </h3>
                <div className="flex flex-col gap-4">
                  <ScoreBar label="Skills Match" score={matchDetails.scores.skill_score} />
                  <ScoreBar
                    label="Semantic Match"
                    score={matchDetails.scores.semantic_score}
                  />
                  <ScoreBar
                    label="Experience Match"
                    score={matchDetails.scores.experience_score}
                  />
                  <ScoreBar
                    label="Education Match"
                    score={matchDetails.scores.education_score}
                  />
                  <ScoreBar label="Keyword Match" score={matchDetails.scores.keyword_score} />
                </div>
              </div>

              <div className="bg-white border border-border-soft rounded-2xl p-6">
                <h3 className="font-heading text-base font-bold text-status-green mb-3">
                  Strengths
                </h3>
                <ul className="flex flex-col gap-2">
                  {matchDetails.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-text-lo flex gap-2">
                      <span className="text-status-green">●</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-border-soft rounded-2xl p-6">
                <h3 className="font-heading text-base font-bold text-status-red mb-3">
                  Weaknesses
                </h3>
                <ul className="flex flex-col gap-2">
                  {matchDetails.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-text-lo flex gap-2">
                      <span className="text-status-red">●</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {skillGap && (
            <>
              <div className="bg-white border border-border-soft rounded-2xl p-6">
                <h3 className="font-heading text-base font-bold text-text-hi mb-1">
                  Skill Gap Analysis
                </h3>
                <p className="text-xs text-text-lo mb-4">
                  Required skills coverage:{" "}
                  <span className="font-bold text-forest">
                    {skillGap.required_coverage_percent}%
                  </span>
                </p>

                {skillGap.missing_required.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-status-red uppercase tracking-wide mb-2">
                      Missing Required Skills  
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {skillGap.missing_required.map((s) => (
                        <span
                          key={s}
                          className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-status-red/8 text-status-red"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skillGap.matched_required.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-status-green uppercase tracking-wide mb-2">
                      Matched Required Skills
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {skillGap.matched_required.map((s) => (
                        <span
                          key={s}
                          className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-status-green/8 text-status-green"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-border-soft rounded-2xl p-6">
                <h3 className="font-heading text-base font-bold text-text-hi mb-4">
                  Learning Recommendations
                </h3>
                <div className="flex flex-col gap-3">
                  {skillGap.recommendations.map((rec, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold text-forest">{rec.skill}</span>
                      <p className="text-text-lo mt-0.5">{rec.resource}</p>
                    </div>
                  ))}
                  {skillGap.recommendations.length === 0 && (
                    <p className="text-xs text-status-green font-semibold">
                      No skill gaps found — candidate meets all requirements!
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {interviewQs && (
            <div className="bg-white border border-border-soft rounded-2xl p-6">
              <h3 className="font-heading text-base font-bold text-text-hi mb-1">
                Interview Questions
              </h3>
              <p className="text-xs text-text-lo mb-4">
                {interviewQs.total_questions} questions generated for {interviewQs.candidate_name}
              </p>

             {Object.entries(interviewQs.questions).map(([category, questions]) => (
               questions.length > 0 && (
                 <div key={category} className="mb-4">
                   <div className="text-[10px] font-bold text-gold uppercase tracking-wide mb-2">
                     {category.replace("_", " ")}
                   </div>
                   <ul className="flex flex-col gap-2">
                     {questions.map((q, i) => (
                       <li key={i} className="text-xs text-text-lo flex gap-2">
                         <span className="text-gold font-bold">{i + 1}.</span> {q}
                       </li>
                      ))}
                   </ul>
                 </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;
