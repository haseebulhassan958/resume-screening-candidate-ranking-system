import { useEffect, useRef, useState } from "react";
import { uploadResumesBatch, getCandidates, deleteCandidate } from "../services/api";
import SkillTag from "../components/SkillTag";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

function Candidates({ onSelectCandidate, onCompare }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);

  async function loadCandidates() {
    try {
      const res = await getCandidates();
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const res = await uploadResumesBatch(files);
      const successCount = res.data.results.filter((r) => r.status === "success").length;
      const failCount = res.data.results.length - successCount;

      setUploadMessage(
        `Uploaded ${successCount} resume(s) successfully.` +
          (failCount > 0 ? ` ${failCount} failed.` : "")
      );
      await loadCandidates();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset file input so the same file can be re-selected later
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this candidate?")) return;
    try {
      await deleteCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected candidate(s)?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteCandidate(id)));
      setCandidates((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-hi">Candidates</h1>
          <p className="text-text-lo text-sm mt-1">
            Upload resumes and manage your candidate pool
          </p>
        </div>

        <div className="flex gap-3">
          {selectedIds.length >= 1 && (
            <button
              onClick={handleBulkDelete}
              className="bg-status-red/10 text-status-red border border-status-red/20 px-5 py-2.5 rounded-xl text-sm font-bold font-heading hover:bg-status-red/20 transition-colors duration-200"
            >
              Delete ({selectedIds.length})
            </button>
          )}
          {selectedIds.length >= 2 && (
            <button
              onClick={() => onCompare(selectedIds)}
              className="bg-gold text-forest-deep px-5 py-2.5 rounded-xl text-sm font-bold font-heading hover:opacity-90 transition-opacity duration-200"
            >
              Compare ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-bold font-heading hover:bg-forest-light transition-colors duration-200 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "+ Upload Resumes"}
          </button>
        </div>
        <input
          type="file"
          accept=".pdf"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadMessage && (
        <div className="mt-4 bg-gold-soft border border-gold/30 text-text-hi text-sm font-medium px-4 py-3 rounded-xl">
          {uploadMessage}
        </div>
      )}

      <div className="bg-white border border-border-soft rounded-2xl mt-6 overflow-hidden">
        {loading ? (
          <Spinner message="Loading candidates..." />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No candidates yet"
            description="Upload your first resume to get started. You can upload multiple PDFs at once."
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-soft text-left">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      candidates.length > 0 &&
                      selectedIds.length === candidates.length
                    }
                    onChange={() => {
                      if (selectedIds.length === candidates.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(candidates.map((c) => c.id));
                      }
                    }}
                    className="w-4 h-4 accent-forest cursor-pointer"
                  />
                </th>
                <th className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-4">
                  Candidate
                </th>
                <th className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-4">
                  Email
                </th>
                <th className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-4">
                  Skills
                </th>
                <th className="text-[11px] font-bold text-text-lo uppercase tracking-wide px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate.id)}
                  className="border-b border-border-soft last:border-0 hover:bg-cream/50 transition-all duration-200 cursor-pointer group"
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => toggleSelect(candidate.id)}
                      className="w-4 h-4 accent-forest cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={candidate.name} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-text-hi group-hover:text-forest transition-colors duration-200">
                          {candidate.name || "Unnamed Candidate"}
                        </div>
                        <div className="text-xs text-text-lo">{candidate.filename}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-lo">
                    {candidate.email || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap max-w-xs">
                      {candidate.skills
                        ? candidate.skills
                            .split(",")
                            .slice(0, 3)
                            .map((skill) => <SkillTag key={skill} skill={skill.trim()} />)
                        : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(candidate.id);
                      }}
                      className="text-status-red text-xs font-bold hover:underline"
                      >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Candidates;