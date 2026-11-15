import { useRef, useState } from "react";
import Evaluation from "./Evaluation";
import { Icon, ProbabilityDial, ContributionBars } from "./Visuals";
import "./App.css";
const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const defaults = {
  Age: 45,
  Gender: "Female",
  ESR: 20,
  CRP: 10.5,
  RF: 18,
  Anti_CCP: 15,
  HLA_B27: "Negative",
  ANA: "Negative",
  Anti_Ro: "Negative",
  Anti_La: "Negative",
  Anti_dsDNA: "Negative",
  Anti_Sm: "Negative",
  C3: 130,
  C4: 38,
};
const numeric = ["Age", "ESR", "CRP", "RF", "Anti_CCP", "C3", "C4"];
const label = (key) => key.replaceAll("_", "-");
const pct = (v) => `${(v * 100).toFixed(2)}%`;
const groups = [
  ["Participant details", "Both fields are required.", ["Age", "Gender"]],
  [
    "Inflammatory & antibody markers",
    "Leave unavailable numeric measurements blank.",
    ["ESR", "CRP", "RF", "Anti_CCP"],
  ],
  [
    "Serology",
    "Select the recorded result, or Not available.",
    ["HLA_B27", "ANA", "Anti_Ro", "Anti_La", "Anti_dsDNA", "Anti_Sm"],
  ],
  ["Complement proteins", "Optional measurements.", ["C3", "C4"]],
];
function Mark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M7 23V9l9-5 9 5v14l-9 5-9-5Z M7 9l9 7 9-7M16 16v12M10 18h12M16 12v12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function Notice({ warnings = [] }) {
  return (
    <div className={warnings.length ? "notice warning" : "notice"}>
      <strong>
        {warnings.length ? "Review input ranges" : "Input checks passed"}
      </strong>
      {warnings.length ? (
        <ul>
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : (
        <p>No training-range warnings were returned.</p>
      )}
    </div>
  );
}
async function request(path, payload) {
  const response = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : [data.detail?.message, ...(data.detail?.issues || [])]
            .filter(Boolean)
            .join(" ") || "Request failed. Review your inputs and try again.",
    );
  return data;
}
export default function App() {
  const [page, setPage] = useState("workspace"),
    [form, setForm] = useState(defaults),
    [submitted, setSubmitted] = useState(null),
    [result, setResult] = useState(null),
    [explanation, setExplanation] = useState(null),
    [scenario, setScenario] = useState(null),
    [feature, setFeature] = useState("ESR"),
    [value, setValue] = useState(""),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const output = useRef(null);
  const payload = Object.fromEntries(
    Object.entries(form).map(([key, val]) => [
      key,
      val === "" ? null : numeric.includes(key) ? Number(val) : val,
    ]),
  );
  const stale =
    submitted && JSON.stringify(payload) !== JSON.stringify(submitted);
  async function predict(e) {
    e.preventDefault();
    setBusy("predict");
    setError("");
    setResult(null);
    setExplanation(null);
    setScenario(null);
    try {
      const data = await request("predict", payload);
      setSubmitted(payload);
      setResult(data);
      requestAnimationFrame(() => {
        output.current?.focus({ preventScroll: true });
        output.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      });
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Cannot reach the prediction service. Check that the backend is running and try again."
          : e.message,
      );
    } finally {
      setBusy("");
    }
  }
  async function explain() {
    setBusy("explain");
    setError("");
    try {
      const data = await request("explain", submitted);
      const detail = data.explanation ?? data.data_quality?.explanation;
      if (!detail)
        throw new Error("No explanation was returned. Please try again.");
      setExplanation(detail);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function whatIf(e) {
    e.preventDefault();
    setBusy("scenario");
    setError("");
    setScenario(null);
    try {
      setScenario(
        await request("what-if", {
          ...submitted,
          feature: label(feature),
          value: numeric.includes(feature) ? Number(value) : value,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  function reset() {
    setForm(defaults);
    setResult(null);
    setSubmitted(null);
    setExplanation(null);
    setScenario(null);
    setError("");
    setValue("");
  }
  const spinner = <span className="spinner" aria-hidden="true" />;
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <header className="topbar">
        <a
          className="brand"
          href="#workspace"
          onClick={() => setPage("workspace")}
        >
          <span className="brand-mark">
            <Mark />
          </span>
          <span>
            Autoimmune<span className="brand-accent">XAI</span>
            <small>Predict · Explain · Explore</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {[
            ["workspace", "Prediction workspace"],
            ["insights", "Prediction Insights"],
            ["evaluation", "Model evaluation"],
          ].map(([key, title]) => (
            <button
              key={key}
              className={page === key ? "nav-active" : ""}
              aria-current={page === key ? "page" : undefined}
              onClick={() => { setPage(key); window.scrollTo({ top: 0 }); }}
            >
              <Icon name={key === "workspace" ? "chart" : key === "insights" ? "insight" : "network"} />
              {title}
            </button>
          ))}
        </nav>
        <span className="research-tag">Research use only</span>
      </header>
      <main id="main" className="container">
        <section className="intro">
          <div className="hero-art" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow">
              EXPLAINABLE INTELLIGENCE · AUTOIMMUNE RESEARCH
            </div>
            <h1>
              {page === "workspace" ? (
                <>
                  Disease prediction.
                  <br />
                  <span className="hero-subheading">Clearer clinical understanding.</span>
                </>
              ) : page === "insights" ? (
                <>Prediction Insights.<br/><span className="hero-subheading">Understand the model output.</span></>
              ) : (
                <>
                  The science behind
                  <br />
                  <span>every prediction.</span>
                </>
              )}
            </h1>
            <p>
              {page === "workspace"
                ? "Explore autoimmune classification through clinical markers, transparent model explanations, and meaningful comparisons."
                : page === "insights" ? "Examine feature contributions and compare scenarios for your submitted prediction."
                : "Explore internal model evaluation, class-level performance, and held-out test analysis."}
            </p>
            <div className="hero-features">
              <span>
                <Icon name="shield" />
                XGBoost classification
              </span>
              <span>
                <Icon name="chart" />7 output classes
              </span>
              <span>
                <Icon name="insight" />
                SHAP explanations
              </span>
            </div>
          </div>
          <div className="hero-caption">
            Explore.
            <br />
            Understand.
            <br />
            <strong>Explain.</strong>
            <span />
          </div>
        </section>
        <div hidden={page !== "workspace"} id="workspace">
          <div className="workspace-grid">
            <section className="panel input-panel">
              <div className="panel-heading">
                <div>
                  <span className="heading-icon">
                    <Icon name="profile" />
                  </span>
                  <div>
                    <span className="eyebrow">01 / MODEL INPUTS</span>
                    <h2>Patient information</h2>
                  </div>
                </div>
                <span className="count">
                  {Object.values(form).filter((v) => v !== "").length}/14
                  entered
                </span>
              </div>
              <p className="panel-description">
                Prefilled values are an example. Review every field before
                running.
              </p>
              <form onSubmit={predict}>
                <fieldset disabled={!!busy} className="all-fields">
                  {groups.map(([title, note, keys], i) => (
                    <section className="field-group" key={title}>
                      <div className="group-heading">
                        <span>0{i + 1}</span>
                        <div>
                          <h3>{title}</h3>
                          <p>{note}</p>
                        </div>
                      </div>
                      <div className="form-grid">
                        {keys.map((key) => (
                          <div className="field" key={key}>
                            <label htmlFor={key}>
                              {label(key)}
                              {["Age", "Gender"].includes(key) && (
                                <span className="required"> *</span>
                              )}
                            </label>
                            {numeric.includes(key) ? (
                              <input
                                id={key}
                                name={key}
                                type="number"
                                step="any"
                                required={key === "Age"}
                                placeholder="Not available"
                                value={form[key]}
                                onChange={(e) =>
                                  setForm({ ...form, [key]: e.target.value })
                                }
                              />
                            ) : (
                              <select
                                id={key}
                                name={key}
                                value={form[key]}
                                onChange={(e) =>
                                  setForm({ ...form, [key]: e.target.value })
                                }
                              >
                                {key !== "Gender" && (
                                  <option value="">Not available</option>
                                )}
                                {(key === "Gender"
                                  ? ["Female", "Male"]
                                  : ["Negative", "Positive"]
                                ).map((v) => (
                                  <option key={v}>{v}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </fieldset>
                <div className="form-actions">
                  <button
                    type="button"
                    className="text-button"
                    disabled={!!busy}
                    onClick={reset}
                  >
                    Reset example
                  </button>
                  <button className="primary" disabled={!!busy} type="submit">
                    {busy === "predict" && spinner}
                    {busy === "predict"
                      ? "Running prediction…"
                      : "Run research prediction"}
                    {!busy && <span aria-hidden="true">↗</span>}
                  </button>
                </div>
                <p className="form-footnote">
                  Missing values are passed to the existing model preprocessing.
                </p>
              </form>
            </section>
            <section
              className="panel output-panel"
              ref={output}
              tabIndex={-1}
              aria-label="Prediction results"
              aria-busy={busy === "predict"}
            >
              <div className="panel-heading">
                <div>
                  <span className="heading-icon">
                    <Icon name="chart" />
                  </span>
                  <div>
                    <span className="eyebrow">02 / MODEL OUTPUT</span>
                    <h2>Prediction result</h2>
                  </div>
                </div>
                <span className="count">
                  {result
                    ? "Complete"
                    : busy === "predict"
                      ? "Processing"
                      : "Awaiting input"}
                </span>
              </div>
              <div role="status" className="sr-only">
                {busy === "predict"
                  ? "Running prediction"
                  : result
                    ? `Prediction complete: ${result.prediction}`
                    : ""}
              </div>
              {error && (
                <div className="notice error" role="alert">
                  <strong>Request unsuccessful</strong>
                  <p>{error}</p>
                </div>
              )}
              {!result ? (
                <div className="empty-state">
                  <span className="empty-mark">
                    {busy === "predict" ? spinner : <Mark />}
                  </span>
                  <h3>
                    {busy === "predict"
                      ? "Analyzing your inputs"
                      : "Your results start here"}
                  </h3>
                  <p>
                    {busy === "predict"
                      ? "The saved model is generating class probabilities. Please keep this page open."
                      : "Review the example inputs or enter your own, then run a research prediction."}
                  </p>
                  <div className="empty-steps">
                    <span>Class probabilities</span>
                    <span>Model uncertainty</span>
                    <span>Feature explanations</span>
                  </div>
                </div>
              ) : (
                <>
                  {stale && (
                    <div className="notice warning">
                      <strong>Inputs have changed</strong>
                      <p>
                        These results and explanations use your last submitted
                        profile. Run a new prediction to include your edits.
                      </p>
                    </div>
                  )}
                  <div className="prediction-highlight">
                    <ProbabilityDial
                      probability={Math.max(
                        ...Object.values(result.probabilities),
                      )}
                    />
                    <div className="prediction-copy">
                      <span className="result-badge">MODEL CLASSIFICATION</span>
                      <h3>{result.prediction}</h3>
                      <p>
                        The highest-probability class for the submitted profile.
                        This is a model output, not a diagnosis.
                      </p>
                    </div>
                  </div>
                  <h3 className="section-title">
                    Class probability distribution
                  </h3>
                  <div className="probability-list">
                    {Object.entries(result.probabilities)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, p]) => (
                        <div key={name} className="probability-row">
                          <div>
                            <span>{name}</span>
                            <strong>{pct(p)}</strong>
                          </div>
                          <div className="probability-track">
                            <div style={{ width: pct(p) }} />
                          </div>
                        </div>
                      ))}
                  </div>
                  {result.uncertainty && (
                    <div className="uncertainty">
                      <div className="split">
                        <h3>Model uncertainty</h3>
                        <span className="count">
                          {result.uncertainty.confidence_level} confidence
                        </span>
                      </div>
                      <div className="uncertainty-grid">
                        <div>
                          <span>Top probability</span>
                          <strong>
                            {pct(result.uncertainty.top_class_probability)}
                          </strong>
                        </div>
                        <div>
                          <span>Top-two margin</span>
                          <strong>
                            {result.uncertainty.top_two_margin.toFixed(4)}
                          </strong>
                        </div>
                        <div>
                          <span>Normalized entropy</span>
                          <strong>
                            {result.uncertainty.entropy.toFixed(4)}
                          </strong>
                        </div>
                      </div>
                      <p className="small">
                        Confidence is a research heuristic, not clinical
                        certainty. Higher entropy means probabilities are more
                        spread out.
                      </p>
                    </div>
                  )}
                  <Notice warnings={result.data_quality?.warnings} />
                  <p className="small">{result.disclaimer}</p>
                  <button type="button" className="insight-link" onClick={() => { setPage("insights"); window.scrollTo({ top: 0 }); }}>
                    <Icon name="insight" />
                    Open Prediction Insights
                    <Icon name="arrow" />
                  </button>
                </>
              )}
              {!result && (
                <div className="output-note">
                  <strong>Designed for model exploration</strong>
                  <p>
                    Probabilities describe model output. They do not establish a
                    diagnosis or an individual's disease risk.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
        <div hidden={page !== "insights"} id="insights" className="insights-page">
          <section className="panel insights-context">
            <div><span className="eyebrow">SUBMITTED PREDICTION</span><h2>{result ? result.prediction : "Start with a prediction"}</h2>
            <p>{result ? `The model assigned ${pct(Math.max(...Object.values(result.probabilities)))} probability to this class. Contributions below describe model behavior, not a clinical diagnosis.` : "Run a prediction in the workspace to explore SHAP explanations and what-if scenarios here."}</p></div>
            <button type="button" className="secondary" onClick={() => { setPage("workspace"); window.scrollTo({ top: 0 }); }}>{result ? "Return to prediction workspace" : "Go to prediction workspace"}</button>
          </section>
          {stale && <div className="notice warning"><strong>Inputs have changed</strong><p>These insights use your last submitted profile. Run a new prediction in the workspace to include your edits.</p></div>}
          {error && <div className="notice error" role="alert"><strong>Request unsuccessful</strong><p>{error}</p></div>}
          <div className="insights-overview">
            <section className="panel feature-panel">
              <div className="panel-heading">
                <div>
                  <span className="heading-icon">
                    <Icon name="network" />
                  </span>
                  <div>
                    <h2>Top feature contributions</h2>
                    <p className="panel-description">
                      The strongest local influences on this prediction.
                    </p>
                  </div>
                </div>
              </div>
              {explanation ? (
                <ContributionBars explanation={explanation} />
              ) : (
                <div className="insight-placeholder">
                  <Icon name="network" />
                  <h3>See what matters to the model</h3>
                  <p>
                    {result
                      ? "Generate a SHAP explanation to reveal the strongest contributions."
                      : "Run a prediction to unlock local feature contributions."}
                  </p>
                  <button
                    className="secondary"
                    disabled={!result || !!busy}
                    onClick={explain}
                  >
                    {busy === "explain"
                      ? "Generating explanation…"
                      : "Generate SHAP explanation"}
                  </button>
                </div>
              )}
            </section>
          </div>
          {result && (
            <div className="analysis-grid">
              <section className="analysis-section">
                <span className="eyebrow">03 / UNDERSTAND THE OUTPUT</span>
                <h3>What influenced this prediction?</h3>
                <p>Inspect feature contributions to the predicted class.</p>
                <button
                  className="secondary"
                  disabled={!!busy}
                  onClick={explain}
                >
                  {busy === "explain" && spinner}
                  {busy === "explain"
                    ? "Generating explanation…"
                    : explanation
                      ? "Refresh SHAP explanation"
                      : "Explain this prediction"}
                </button>
                {explanation && (
                  <div className="shap-results">
                    {[
                      ["positive_contributions", "Supporting the prediction"],
                      ["negative_contributions", "Opposing the prediction"],
                    ].map(([key, title]) => (
                      <section key={key}>
                        <h4>{title}</h4>
                        {explanation[key]?.length ? (
                          explanation[key].map((item) => (
                            <div
                              className={`shap-row ${key}`}
                              key={item.feature}
                            >
                              <span>
                                {item.feature.replace(/^(num|cat)__/, "")}
                              </span>
                              <strong>
                                {item.shap_value > 0 ? "+" : ""}
                                {item.shap_value.toFixed(4)}
                              </strong>
                            </div>
                          ))
                        ) : (
                          <p>No contributions in this direction.</p>
                        )}
                      </section>
                    ))}
                    <p className="small">{explanation.disclaimer}</p>
                  </div>
                )}
              </section>
              <section className="analysis-section">
                <span className="eyebrow">MODEL SENSITIVITY</span>
                <h3>Explore a what-if scenario</h3>
                <p>
                  Change one input from the submitted profile to compare
                  outputs.
                </p>
                <form onSubmit={whatIf}>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="scenario-feature">Feature</label>
                      <select
                        id="scenario-feature"
                        disabled={!!busy}
                        value={feature}
                        onChange={(e) => {
                          setFeature(e.target.value);
                          setValue("");
                          setScenario(null);
                        }}
                      >
                        {Object.keys(defaults).map((key) => (
                          <option key={key} value={key}>
                            {label(key)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="scenario-value">New value</label>
                      {numeric.includes(feature) ? (
                        <input
                          id="scenario-value"
                          required
                          type="number"
                          step="any"
                          value={value}
                          disabled={!!busy}
                          onChange={(e) => {
                            setValue(e.target.value);
                            setScenario(null);
                          }}
                          placeholder={`Enter ${label(feature)}`}
                        />
                      ) : (
                        <select
                          id="scenario-value"
                          required
                          disabled={!!busy}
                          value={value}
                          onChange={(e) => {
                            setValue(e.target.value);
                            setScenario(null);
                          }}
                        >
                          <option value="">Select a value</option>
                          {(feature === "Gender"
                            ? ["Female", "Male"]
                            : ["Negative", "Positive"]
                          ).map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <button className="secondary" disabled={!!busy}>
                    {busy === "scenario" && spinner}
                    {busy === "scenario"
                      ? "Comparing outputs…"
                      : "Compare scenario"}
                  </button>
                </form>
                {scenario && (
                  <div className="scenario-result" role="status">
                    <p>
                      <strong>{scenario.feature}:</strong>{" "}
                      {String(scenario.original_value ?? "Not available")} →{" "}
                      {String(scenario.new_value)}
                    </p>
                    <div className="scenario-summary">
                      <div>
                        <span>Baseline</span>
                        <strong>{scenario.baseline.prediction}</strong>
                      </div>
                      <div>
                        <span>What-if</span>
                        <strong>{scenario.what_if.prediction}</strong>
                      </div>
                    </div>
                    <h4>
                      Probability change <small>(percentage points)</small>
                    </h4>
                    {Object.entries(scenario.delta).map(([name, delta]) => (
                      <div className="shap-row" key={name}>
                        <span>{name}</span>
                        <strong>
                          {delta >= 0 ? "+" : ""}
                          {(delta * 100).toFixed(2)}
                        </strong>
                      </div>
                    ))}
                    <Notice warnings={scenario.data_quality?.warnings} />
                    <p className="small">{scenario.disclaimer}</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
        {page === "evaluation" && <Evaluation />}
        <footer>
          <div>
            <strong>Research, with context.</strong>
            <p>
              AutoimmuneXAI is an academic research system. Predictions and
              explanations are not medical diagnoses, clinical advice, or
              treatment recommendations.
            </p>
          </div>
          <span>
            AutoimmuneXAI <b> / </b> Research workspace
          </span>
        </footer>
      </main>
    </div>
  );
}
