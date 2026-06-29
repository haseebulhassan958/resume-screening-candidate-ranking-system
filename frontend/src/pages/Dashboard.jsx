import { useEffect, useState } from "react";
import ScoreRing from "../components/ScoreRing";
import SkillTag from "../components/SkillTag";
import VerdictBadge from "../components/VerdictBadge";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  getCandidates,
  getJobs,
  scoreAllCandidates,
  getRanking,
  getExportUrl,
  getInsights,
} from "../services/api";

function Dashboard() {
    const [candidates, setCandidates] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedJobId, setSelectedJobId] = useState("");
    const [ranking, setRanking] = useState(null);
    const [scoring, setScoring] = useState(false);
    const [scoringError, setScoringError] = useState(null);
    const [insights, setInsights] = useState(null);

    useEffect(() => {
        async function loadData() {
      try {
        const [candidatesRes, jobsRes, insightsRes] = await Promise.all([
          getCandidates(),
          getJobs(),
          getInsights(),
        ]);
        setCandidates(candidatesRes.data);
        setJobs(jobsRes.data);
        setInsights(insightsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Could not connect to the backend. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    }
        loadData();
    }, []);

    async function handleScoreAll() {
        if (!selectedJobId) {
            setScoringError("Please select a job first.");
            return;
        }

        setScoring(true);
        setScoringError(null);

        try {
            await scoreAllCandidates(selectedJobId);
            const res = await getRanking(selectedJobId);
            setRanking(res.data);
        } catch (err) {
            console.error("Scoring failed:", err);
            setScoringError("Could not score candidates. Make sure you have candidates uploaded.");
        } finally {
            setScoring(false);
        }
    }

    if (loading) {
    return <Spinner message="Loading dashboard..." />;
    }

    if (error) {
        return (
            <div className="bg-white border border-border-soft rounded-2xl p-6">
                <p className="text-status-red text-sm font-semibold">{error}</p>
            </div>
        );
    }

    return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-hi">Dashboard</h1>
      <p className="text-text-lo text-sm mt-1">
        Overview of your hiring pipeline and AI screening insights
      </p>

      <div className="grid grid-cols-4 gap-4 mt-8">
        <StatCard label="Total Resumes" value={candidates.length} />
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard
          label="Candidates Parsed"
          value={candidates.filter((c) => c.name).length}
        />
        <StatCard label="Avg. Skills per Resume" value={avgSkillCount(candidates)} />
      </div>

      <div className="bg-white border border-border-soft rounded-2xl mt-8 p-6">
        <h3 className="font-heading text-base font-bold text-text-hi mb-1">
          Candidate Ranking
        </h3>
        <p className="text-text-lo text-sm mb-5">
          Select a job to screen and rank all candidates against it
        </p>

        <div className="flex items-center gap-4">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-border-soft text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <option value="">Select a job description...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleScoreAll}
            disabled={scoring}
            className="bg-forest text-white px-6 py-3 rounded-xl text-sm font-bold font-heading hover:bg-forest-light transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
          >
            {scoring ? "Scoring..." : "Score All Candidates"}
          </button>
        </div>

        {scoringError && (
          <p className="text-status-red text-sm font-medium mt-4">{scoringError}</p>
        )}

        {scoring && (
          <div className="mt-6 flex flex-col items-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-border-soft border-t-forest rounded-full animate-spin" />
            <p className="text-text-lo text-sm font-medium">
              Running AI scoring engine — analyzing resumes against job description...
            </p>
          </div>
        )}

        {!scoring && ranking && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-text-hi">
                {ranking.job_title} — {ranking.total_candidates} candidates ranked
              </div>
              
                <a href={getExportUrl(selectedJobId)}
                className="text-xs font-bold text-forest border border-forest/30 px-3 py-2 rounded-lg hover:bg-forest/5 transition-colors duration-150"
              >
                ⬇ Export CSV
              </a>
            </div>

            <div className="flex flex-col gap-3">
              {ranking.ranking.map((candidate) => (
                <div
                  key={candidate.candidate_id}
                  className="border border-border-soft rounded-2xl p-5 flex items-center gap-5"
                >
                  <div className="w-9 h-9 rounded-xl bg-gold-soft text-gold flex items-center justify-center font-heading font-extrabold text-sm flex-shrink-0">
                    {candidate.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text-hi">
                      {candidate.name || "Unnamed Candidate"}
                    </div>
                    <div className="text-xs text-text-lo mt-0.5">{candidate.email}</div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {candidate.skills
                        ? candidate.skills
                            .split(",")
                            .slice(0, 4)
                            .map((skill) => <SkillTag key={skill} skill={skill.trim()} />)
                        : null}
                    </div>
                  </div>

                  <ScoreRing score={candidate.overall_score} size={72} />

                  <VerdictBadge verdict={candidate.verdict} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Screening Insights */}
      {insights && (
        <div className="grid grid-cols-2 gap-6 mt-6">

          {/* Top Candidates */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-1">
              Top Ranked Candidates
            </h3>
            <p className="text-text-lo text-xs mb-5">
              Highest scoring candidates across all jobs
            </p>

            {insights.top_candidates.length === 0 ? (
              <p className="text-text-lo text-sm">
                No scored candidates yet. Run scoring from the Candidate Ranking section above.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {insights.top_candidates.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 border-b border-border-soft last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gold-soft text-gold flex items-center justify-center font-heading font-extrabold text-xs flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-text-hi truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-text-lo truncate">{c.job_title}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-extrabold font-heading text-forest">
                        {c.overall_score}%
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.verdict === "Strong Fit"
                            ? "bg-status-green/10 text-status-green"
                            : c.verdict === "Good Fit"
                            ? "bg-forest/10 text-forest"
                            : "bg-status-amber/10 text-status-amber"
                        }`}
                      >
                        {c.verdict}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill Demand Analysis */}
          <div className="bg-white border border-border-soft rounded-2xl p-6">
            <h3 className="font-heading text-base font-bold text-text-hi mb-1">
              In-Demand Skills
            </h3>
            <p className="text-text-lo text-xs mb-5">
              Most frequently required skills across all job descriptions
            </p>

            {insights.top_demanded_skills.length === 0 ? (
              <p className="text-text-lo text-sm">
                No job descriptions added yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {insights.top_demanded_skills.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-text-hi capitalize">
                        {item.skill}
                      </span>
                      <span className="text-xs font-bold text-text-lo">
                        {item.count} {item.count === 1 ? "job" : "jobs"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border-soft overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest transition-all duration-700 ease-out"
                        style={{
                          width: `${(item.count / insights.top_demanded_skills[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Screening coverage */}
            <div className="mt-5 pt-5 border-t border-border-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-lo">
                  Screening Coverage
                </span>
                <span className="text-xs font-bold text-forest">
                  {insights.coverage.screening_rate}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border-soft overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
                  style={{ width: `${insights.coverage.screening_rate}%` }}
                />
              </div>
              <p className="text-[10px] text-text-lo mt-1.5">
                {insights.coverage.scored_candidates} of {insights.coverage.total_candidates} candidates scored
              </p>
            </div>
          </div>

        </div>
      )}
    </div >
  );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-white border border-border-soft rounded-2xl p-5">
            <div className="font-heading text-2xl font-extrabold text-text-hi">{value}</div>
            <div className="text-xs text-text-lo mt-1 font-medium">{label}</div>
        </div>
    );
}

function avgSkillCount(candidates) {
    if (candidates.length === 0) return 0;
    const total = candidates.reduce((sum, c) => {
        const skillCount = c.skills ? c.skills.split(",").filter((s) => s.trim()).length : 0;
        return sum + skillCount;
    }, 0);
    return Math.round(total / candidates.length);
}

export default Dashboard;