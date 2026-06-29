import { useEffect, useState } from "react";
import { uploadJobText, getJobs, deleteJob } from "../services/api";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

function Jobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function loadJobs() {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both the title and description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await uploadJobText(title, description);
      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadJobs();
    } catch (err) {
      console.error("Failed to submit job:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this job description?")) return;
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function toggleJobSelect(id) {
  setSelectedJobIds((prev) =>
    prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
  );
}

async function handleBulkDeleteJobs() {
  if (selectedJobIds.length === 0) return;
  if (!confirm(`Delete ${selectedJobIds.length} selected job(s)?`)) return;
  try {
    await Promise.all(selectedJobIds.map((id) => deleteJob(id)));
    setJobs((prev) => prev.filter((j) => !selectedJobIds.includes(j.id)));
    setSelectedJobIds([]);
  } catch (err) {
    console.error("Bulk delete failed:", err);
  }
}

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-hi">
            Job Descriptions
          </h1>
          <p className="text-text-lo text-sm mt-1">
            Add job descriptions to screen and rank candidates against
          </p>
        </div>

        <div className="flex gap-3">
          {selectedJobIds.length >= 1 && (
            <button
              onClick={handleBulkDeleteJobs}
              className="bg-status-red/10 text-status-red border border-status-red/20 px-5 py-2.5 rounded-xl text-sm font-bold font-heading hover:bg-status-red/20 transition-colors duration-200"
            >
              Delete ({selectedJobIds.length})
            </button>
          )}
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-bold font-heading hover:bg-forest-light transition-colors duration-200"
          >
            {showForm ? "Cancel" : "+ Add Job Description"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-border-soft rounded-2xl mt-6 p-6"
        >
          <div className="mb-4">
            <label className="text-xs font-bold text-text-lo uppercase tracking-wide">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full mt-2 px-4 py-3 rounded-xl border border-border-soft text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-lo uppercase tracking-wide">
              Job Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description here, including required skills, experience, and qualifications..."
              rows={8}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-border-soft text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 resize-none"
            />
          </div>

          {error && <p className="text-status-red text-sm font-medium mt-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 bg-forest text-white px-6 py-3 rounded-xl text-sm font-bold font-heading hover:bg-forest-light transition-colors duration-200 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Job Description"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6">
        {loading ? (
          <div className="col-span-2"><Spinner message="Loading job descriptions..." /></div>
        ) : jobs.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon="💼"
              title="No job descriptions yet"
              description="Add your first job description to start screening and ranking candidates against it."
            />
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="bg-white border border-border-soft rounded-2xl p-5 cursor-pointer hover:border-forest/30 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedJobIds.includes(job.id)}
                    onChange={() => toggleJobSelect(job.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-forest cursor-pointer flex-shrink-0"
                  />
                  <h3 className="font-heading text-base font-bold text-text-hi">
                    {job.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(job.id);
                  }}
                  className="text-status-red text-xs font-bold hover:underline flex-shrink-0 ml-3"
                >
                  Delete
                </button>
              </div>

              <div className="flex gap-4 mt-3 text-xs text-text-lo font-medium">
                <span>{job.min_experience_years || 0}+ yrs experience</span>
              </div>

              <div className="mt-4">
              <div className="text-[10px] font-bold text-text-lo uppercase tracking-wide mb-2">
                Required Skills
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {job.required_skills
                  ? job.required_skills.split(",").map((skill) => (
                      <span
                        key={skill}
                        className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-forest/8 text-forest"
                      >
                        {skill.trim()}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>

            {job.preferred_skills && (
              <div className="mt-3">
                <div className="text-[10px] font-bold text-text-lo uppercase tracking-wide mb-2">
                  Preferred Skills
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {job.preferred_skills.split(",").map((skill) => (
                    <span
                      key={skill}
                      className="text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-700"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Jobs;