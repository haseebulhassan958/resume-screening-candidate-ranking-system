function ScoreBar({ label, score }) {
  const getColor = () => {
    if (score >= 80) return "bg-status-green";
    if (score >= 60) return "bg-forest";
    if (score >= 40) return "bg-status-amber";
    return "bg-status-red";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-text-hi">{label}</span>
        <span className="text-xs font-bold text-text-lo">{Math.round(score)}/100</span>
      </div>
      <div className="h-2 rounded-full bg-border-soft overflow-hidden">
        <div
          className={`h-full rounded-full ${getColor()} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;