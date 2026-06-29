import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Jobs from "./pages/Jobs";
import Settings from "./pages/Settings";
import CandidateProfile from "./pages/CandidateProfile";
import Compare from "./pages/Compare";
import PageWrapper from "./components/PageWrapper";
import JobDetail from "./pages/JobDetail";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [compareIds, setCompareIds] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  function handleNavigate(page) {
    setSelectedCandidateId(null);
    setCompareIds(null);
    setSelectedJobId(null);
    setActivePage(page);
  }

  function openCandidateProfile(id) {
    setCompareIds(null);
    setSelectedCandidateId(id);
  }

  function closeCandidateProfile() {
    setSelectedCandidateId(null);
  }

  function openCompare(ids) {
    setSelectedCandidateId(null);
    setCompareIds(ids);
  }

  function closeCompare() {
    setCompareIds(null);
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      <main className="p-9">
        <PageWrapper key={activePage + (selectedCandidateId || "") + (compareIds || "")}>
          {activePage === "dashboard" && <Dashboard />}

          {activePage === "candidates" && (
            <>
              {compareIds ? (
                <Compare candidateIds={compareIds} onBack={closeCompare} />
              ) : selectedCandidateId ? (
                <CandidateProfile
                  candidateId={selectedCandidateId}
                  onBack={closeCandidateProfile}
                />
              ) : (
                <Candidates
                  onSelectCandidate={openCandidateProfile}
                  onCompare={openCompare}
                />
              )}
            </>
          )}

          {activePage === "jobs" && (
          selectedJobId ? (
            <JobDetail
              jobId={selectedJobId}
              onBack={() => setSelectedJobId(null)}
            />
          ) : (
            <Jobs onSelectJob={setSelectedJobId} />
          )
         )}

          {activePage === "settings" && <Settings />}
        </PageWrapper>
      </main>
    </div>
  );
}

export default App;