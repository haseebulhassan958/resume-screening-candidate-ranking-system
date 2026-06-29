function VerdictBadge({ verdict }) {
  const styles = {
    "Strong Fit": "bg-status-green/10 text-status-green border-status-green/20",
    "Good Fit": "bg-forest/10 text-forest border-forest/20",
    "Average Fit": "bg-status-amber/10 text-status-amber border-status-amber/20",
    "Low Fit": "bg-status-red/10 text-status-red border-status-red/20",
  };

  return (
    <span
      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
        styles[verdict] || styles["Average Fit"]
      }`}
    >
      {verdict}
    </span>
  );
}

export default VerdictBadge;