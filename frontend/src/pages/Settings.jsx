function Settings() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-text-hi">Settings</h1>
      <p className="text-text-lo text-sm mt-1">
        System configuration and application information
      </p>

      <div className="grid grid-cols-2 gap-6 mt-8">
        {/* Scoring Weights */}
        <div className="bg-white border border-border-soft rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-text-hi mb-1">
            AI Scoring Weights
          </h3>
          <p className="text-xs text-text-lo mb-5">
            How the overall match score is calculated from each component
          </p>

          <div className="flex flex-col gap-4">
            <WeightRow label="Skills Match" weight={35} color="bg-status-green" />
            <WeightRow label="Semantic Similarity" weight={30} color="bg-forest" />
            <WeightRow label="Experience Match" weight={15} color="bg-gold" />
            <WeightRow label="Education Match" weight={10} color="bg-status-amber" />
            <WeightRow label="Keyword Match" weight={10} color="bg-status-red" />
          </div>

          <div className="mt-4 pt-4 border-t border-border-soft">
            <p className="text-xs text-text-lo">
              These weights are designed to prioritize technical skill alignment
              while also considering contextual and semantic relevance.
              Total: <span className="font-bold text-text-hi">100%</span>
            </p>
          </div>
        </div>

        {/* Verdict Thresholds */}
        <div className="bg-white border border-border-soft rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-text-hi mb-1">
            Verdict Thresholds
          </h3>
          <p className="text-xs text-text-lo mb-5">
            How overall scores map to candidate verdicts
          </p>

          <div className="flex flex-col gap-3">
            <VerdictRow label="Strong Fit" range="80 — 100" color="text-status-green" bg="bg-status-green/8" />
            <VerdictRow label="Good Fit" range="60 — 79" color="text-forest" bg="bg-forest/8" />
            <VerdictRow label="Average Fit" range="40 — 59" color="text-status-amber" bg="bg-status-amber/8" />
            <VerdictRow label="Low Fit" range="0 — 39" color="text-status-red" bg="bg-status-red/8" />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white border border-border-soft rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-text-hi mb-1">
            Technology Stack
          </h3>
          <p className="text-xs text-text-lo mb-5">
            Libraries and frameworks powering this system
          </p>

          <div className="flex flex-col gap-3">
            <TechRow category="Backend" tech="FastAPI + Python 3.12" />
            <TechRow category="Database" tech="SQLite + SQLAlchemy ORM" />
            <TechRow category="PDF Extraction" tech="PyMuPDF + pdfplumber" />
            <TechRow category="NLP & Parsing" tech="spaCy (en_core_web_sm) + NLTK" />
            <TechRow category="Semantic AI" tech="Sentence Transformers (all-MiniLM-L6-v2)" />
            <TechRow category="Skill Matching" tech="TF-IDF keyword extraction + regex" />
            <TechRow category="Frontend" tech="React 18 + Vite + Tailwind CSS v4" />
          </div>
        </div>

        {/* About */}
        <div className="bg-white border border-border-soft rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-text-hi mb-1">
            About This System
          </h3>
          <p className="text-xs text-text-lo mb-5">
            Project information and methodology
          </p>

          <div className="flex flex-col gap-4 text-xs text-text-lo leading-relaxed">
            <p>
              <span className="font-bold text-text-hi">Task ID:</span> AI-2 — 
              AI-Powered Resume Screening & Candidate Ranking System
            </p>
            <p>
              <span className="font-bold text-text-hi">Organization:</span> Teyzix Core Internship (June Batch 2026)
            </p>
            <p>
              <span className="font-bold text-text-hi">Scoring Methodology:</span> Candidates
              are ranked using a transparent, explainable 5-component weighted scoring system.
              Each component is independently calculated and contributes proportionally
              to the final score, ensuring fair and interpretable results.
            </p>
            <p>
              <span className="font-bold text-text-hi">Semantic Analysis:</span> The
              all-MiniLM-L6-v2 sentence transformer model converts resume and job
              description text into dense vector embeddings, measuring semantic
              similarity via cosine distance — capturing meaning beyond simple keyword overlap.
            </p>
            <p>
              <span className="font-bold text-text-hi">Developer:</span> Muhammad Haseeb Ul Hassan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightRow({ label, weight, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-text-hi">{label}</span>
        <span className="text-xs font-bold text-text-lo">{weight}%</span>
      </div>
      <div className="h-2 rounded-full bg-border-soft overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${weight}%` }}
        />
      </div>
    </div>
  );
}

function VerdictRow({ label, range, color, bg }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${bg}`}>
      <span className={`text-xs font-bold ${color}`}>{label}</span>
      <span className="text-xs font-bold text-text-lo font-heading">{range}</span>
    </div>
  );
}

function TechRow({ category, tech }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border-soft last:border-0">
      <span className="text-[10px] font-bold text-text-lo uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
        {category}
      </span>
      <span className="text-xs font-semibold text-text-hi">{tech}</span>
    </div>
  );
}

export default Settings;