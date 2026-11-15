export function Icon({ name = "chart" }) {
  const paths = {
    chart: (
      <>
        <path d="M4 20h16M6 16v-5M12 16V7M18 16V3" />
      </>
    ),
    profile: (
      <>
        <path d="M8 3h8l4 4v14H4V3h4Zm8 0v5h4M8 12h8M8 16h5" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    insight: (
      <>
        <path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7M8 17h8M9 21h6M12 16v-5m-3-2 3 2 3-2" />
      </>
    ),
    network: (
      <>
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="18" r="3" />
        <circle cx="19" cy="18" r="3" />
        <path d="m10 8-4 7m8-7 4 7M8 18h8" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.chart}
    </svg>
  );
}

export function ProbabilityDial({ probability }) {
  return (
    <div className="probability-dial">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="dial-track" cx="60" cy="60" r="51" />
        <circle
          className="dial-value"
          cx="60"
          cy="60"
          r="51"
          pathLength="100"
          strokeDasharray={`${probability * 100} 100`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div>
        <strong>
          {(probability * 100).toFixed(2)}
          <small>%</small>
        </strong>
        <span>Probability</span>
      </div>
    </div>
  );
}

export function ContributionBars({ explanation }) {
  const items = [
    ...(explanation?.positive_contributions || []),
    ...(explanation?.negative_contributions || []),
  ]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 5);
  const maximum = Math.max(
    ...items.map((item) => Math.abs(item.shap_value)),
    0.001,
  );
  return (
    <div className="contribution-bars">
      {items.map((item) => (
        <div className="contribution-item" key={item.feature}>
          <div>
            <span>{item.feature.replace(/^(num|cat)__/, "")}</span>
            <strong>
              {item.shap_value > 0 ? "+" : ""}
              {item.shap_value.toFixed(4)}
            </strong>
          </div>
          <div className="contribution-track">
            <span
              className={item.shap_value < 0 ? "opposing" : ""}
              style={{
                width: `${(Math.abs(item.shap_value) / maximum) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="small">
        Local SHAP contributions · green supports, amber opposes the predicted
        class. Bar lengths show relative magnitude.
      </p>
    </div>
  );
}
