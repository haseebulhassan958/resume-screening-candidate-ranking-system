import { useEffect, useState } from "react";
import { getCandidateById } from "../services/api";
import SkillTag from "../components/SkillTag";
import Avatar from "../components/Avatar";

function Compare({ candidateIds, onBack }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const results = await Promise.all(
          candidateIds.map((id) => getCandidateById(id))
        );
        setCandidates(results.map((res) => res.data));
      } catch (err) {
        console.error("Failed to load candidates for comparison:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, [candidateIds]);

  if (loading) {
    return <p className="text-text-lo text-sm">Loading comparison...</p>;
  }

  // Build a union of all skills across the selected candidates,
  // so we can show a consistent skill-comparison grid.
  const allSkills = Array.from(
    new Set(
      candidates.flatMap((c) =>
        c.skills ? c.skills.split(",").map((s) => s.trim()).filter(Boolean) : []
      )
    )
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm font-semibold text-text-lo hover:text-text-hi transition-colors duration-150 mb-5"
      >
        ← Back to Candidates
      </button>

      <h1 className="font-heading text-2xl font-bold text-text-hi mb-1">
        Compare Candidates
      </h1>
      <p className="text-text-lo text-sm mb-6">
        Side-by-side comparison of {candidates.length} selected candidates
      </p>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}
      >
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white border border-border-soft rounded-2xl p-6"
          >
            <Avatar name={candidate.name} size="lg" />
            <h3 className="font-heading text-base font-bold text-text-hi">
              {candidate.name || "Unnamed Candidate"}
            </h3>
            <p className="text-xs text-text-lo mt-1">{candidate.email}</p>
            <p className="text-xs text-text-lo">{candidate.phone}</p>

            <div className="mt-4 pt-4 border-t border-border-soft">
              <div className="text-[10px] font-bold text-text-lo uppercase tracking-wide mb-2">
                Education
              </div>
              <p className="text-xs text-text-hi leading-relaxed">
                {candidate.education
                  ? candidate.education.split("\n")[0]
                  : "Not specified"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Skill-by-skill comparison table */}
      <div className="bg-white border border-border-soft rounded-2xl mt-6 overflow-hidden">
        <div className="p-6 border-b border-border-soft">
          <h3 className="font-heading text-base font-bold text-text-hi">
            Skill Comparison
          </h3>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border-soft text-left">
              <th className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-3">
                Skill
              </th>
              {candidates.map((c) => (
                <th
                  key={c.id}
                  className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-3 text-center"
                >
                  {c.name ? c.name.split(" ")[0] : "Candidate"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allSkills.length === 0 ? (
              <tr>
                <td
                  colSpan={candidates.length + 1}
                  className="px-6 py-4 text-sm text-text-lo"
                >
                  No skills found for these candidates.
                </td>
              </tr>
            ) : (
              allSkills.map((skill) => (
                <tr key={skill} className="border-b border-border-soft last:border-0">
                  <td className="px-6 py-3">
                    <SkillTag skill={skill} />
                  </td>
                  {candidates.map((c) => {
                    const hasSkill = c.skills
                      ?.split(",")
                      .map((s) => s.trim().toLowerCase())
                      .includes(skill.toLowerCase());
                    return (
                      <td key={c.id} className="px-6 py-3 text-center">
                        {hasSkill ? (
                          <span className="text-status-green font-bold">✓</span>
                        ) : (
                          <span className="text-border-soft">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Compare;