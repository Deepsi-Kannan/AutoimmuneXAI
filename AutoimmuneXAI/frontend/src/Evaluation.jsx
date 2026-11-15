import { Icon } from "./Visuals";
const modelPerformance = [
  {
    name: "Logistic Regression",
    macroF1: 0.7829,
    rocAuc: 0.9744,
  },
  {
    name: "Decision Tree",
    macroF1: 0.7968,
    rocAuc: 0.8815,
  },
  {
    name: "Random Forest",
    macroF1: 0.8303,
    rocAuc: 0.982,
  },
  {
    name: "XGBoost",
    macroF1: 0.8308,
    rocAuc: 0.9854,
  },
  {
    name: "SVM",
    macroF1: 0.7829,
    rocAuc: 0.9766,
  },
];
const finalModelPerformance = {
  model: "XGBoost 2.1.4",

  test: {
    accuracy: 0.8556,
    precision: 0.8785,
    recall: 0.8406,
    macroF1: 0.8551,
    weightedF1: 0.8533,
    balancedAccuracy: 0.8406,
    rocAuc: 0.9875,
    overfitGap: 0.0619,
  },

  cv: {
    accuracy: 0.8391,
    accuracyStd: 0.0078,
    precision: 0.8613,
    precisionStd: 0.0097,
    recall: 0.8166,
    recallStd: 0.0064,
    macroF1: 0.8317,
    macroF1Std: 0.0069,
    balancedAccuracy: 0.8166,
    rocAuc: 0.9855,
    rocAucStd: 0.0011,
  },
};
const confusionMatrixLabels = [
  "Ankylosing Spondylitis",
  "Normal",
  "Psoriatic Arthritis",
  "Reactive Arthritis",
  "Rheumatoid Arthritis",
  "Sjögren's Syndrome",
  "Systemic Lupus Erythematosus",
];

const confusionMatrix = [
  [268, 1, 49, 2, 105, 0, 0],
  [1, 276, 5, 0, 0, 39, 0],
  [40, 0, 317, 0, 0, 0, 0],
  [22, 0, 1, 70, 10, 0, 0],
  [28, 0, 1, 3, 538, 0, 0],
  [5, 25, 0, 0, 2, 338, 0],
  [0, 3, 0, 0, 0, 3, 265],
];

const normalizedConfusionMatrix = [
  [0.63, 0.0, 0.12, 0.0, 0.25, 0.0, 0.0],
  [0.0, 0.86, 0.02, 0.0, 0.0, 0.12, 0.0],
  [0.11, 0.0, 0.89, 0.0, 0.0, 0.0, 0.0],
  [0.21, 0.0, 0.01, 0.68, 0.1, 0.0, 0.0],
  [0.05, 0.0, 0.0, 0.01, 0.94, 0.0, 0.0],
  [0.01, 0.07, 0.0, 0.0, 0.01, 0.91, 0.0],
  [0.0, 0.01, 0.0, 0.0, 0.0, 0.01, 0.98],
];
const classPerformance = [
  {
    name: "Ankylosing Spondylitis",
    precision: 0.7363,
    recall: 0.6306,
    f1: 0.6793,
    support: 425,
  },
  {
    name: "Normal",
    precision: 0.9049,
    recall: 0.8598,
    f1: 0.8818,
    support: 321,
  },
  {
    name: "Psoriatic Arthritis",
    precision: 0.8499,
    recall: 0.888,
    f1: 0.8685,
    support: 357,
  },
  {
    name: "Reactive Arthritis",
    precision: 0.9333,
    recall: 0.6796,
    f1: 0.7865,
    support: 103,
  },
  {
    name: "Rheumatoid Arthritis",
    precision: 0.8214,
    recall: 0.9439,
    f1: 0.8784,
    support: 570,
  },
  {
    name: "Sjögren's Syndrome",
    precision: 0.8895,
    recall: 0.9135,
    f1: 0.9013,
    support: 370,
  },
  {
    name: "Systemic Lupus Erythematosus",
    precision: 1.0,
    recall: 0.9779,
    f1: 0.9888,
    support: 271,
  },
];

export default function Evaluation() {
  return (
    <section className="performance-panel">
      <div className="panel-header">
        <div>
          <div className="card-label">EVALUATION</div>

          <h2>Model Performance</h2>

          <p className="performance-subtitle">
            5-fold stratified cross-validation results
          </p>
        </div>

        <div className="api-badge">Internal Validation</div>
      </div>

      <div className="performance-table">
        <div className="performance-row performance-header">
          <span>Model</span>
          <span>Macro F1</span>
          <span>ROC-AUC</span>
        </div>

        {modelPerformance.map((model) => (
          <div className="performance-row" key={model.name}>
            <span className="performance-model">{model.name}</span>

            <span className="performance-metric">
              {model.macroF1.toFixed(4)}
            </span>

            <span className="performance-metric">
              {model.rocAuc.toFixed(4)}
            </span>
          </div>
        ))}
      </div>

      <div className="performance-note">
        Metrics are based on internal cross-validation. They describe model
        performance on this dataset and should not be interpreted as external or
        clinical validation.
      </div>
      {/* =================================================
            FINAL MODEL EVALUATION
            ================================================= */}

      <div className="final-performance">
        <div className="card-label">SELECTED MODEL EVALUATION</div>

        <div className="final-performance-header">
          <div>
            <h3>{finalModelPerformance.model}</h3>

            <p>Held-out test evaluation</p>
          </div>

          <span className="final-model-badge">FINAL MODEL</span>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <span>Test Accuracy</span>
            <strong>
              {(finalModelPerformance.test.accuracy * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro Precision</span>
            <strong>
              {(finalModelPerformance.test.precision * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro Recall</span>
            <strong>
              {(finalModelPerformance.test.recall * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro F1</span>
            <strong>
              {(finalModelPerformance.test.macroF1 * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Weighted F1</span>
            <strong>
              {(finalModelPerformance.test.weightedF1 * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Balanced Accuracy</span>
            <strong>
              {(finalModelPerformance.test.balancedAccuracy * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>ROC-AUC</span>
            <strong>
              {(finalModelPerformance.test.rocAuc * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro F1 Gap</span>
            <strong>
              {(finalModelPerformance.test.overfitGap * 100).toFixed(2)}%
            </strong>
          </div>
        </div>

        <div className="cv-summary">
          <div className="card-label">5-FOLD CROSS-VALIDATION</div>

          <div className="cv-grid">
            <div>
              <span>Accuracy</span>
              <strong>
                {(finalModelPerformance.cv.accuracy * 100).toFixed(2)}%{" ± "}
                {(finalModelPerformance.cv.accuracyStd * 100).toFixed(2)}%
              </strong>
            </div>

            <div>
              <span>Macro F1</span>
              <strong>
                {(finalModelPerformance.cv.macroF1 * 100).toFixed(2)}%{" ± "}
                {(finalModelPerformance.cv.macroF1Std * 100).toFixed(2)}%
              </strong>
            </div>

            <div>
              <span>ROC-AUC</span>
              <strong>
                {(finalModelPerformance.cv.rocAuc * 100).toFixed(2)}%{" ± "}
                {(finalModelPerformance.cv.rocAucStd * 100).toFixed(2)}%
              </strong>
            </div>
          </div>
        </div>
      </div>
      {/* =================================================
            CONFUSION MATRIX
            ================================================= */}

      <div className="confusion-section">
        <div className="card-label">CLASSIFICATION ERROR ANALYSIS</div>

        <h3>Confusion Matrix</h3>

        <p className="confusion-subtitle">
          Final tuned XGBoost — held-out test set
        </p>

        <div className="confusion-table-wrapper">
          <table className="confusion-table">
            <thead>
              <tr>
                <th>Actual \ Predicted</th>

                {confusionMatrixLabels.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {confusionMatrix.map((row, rowIndex) => (
                <tr key={confusionMatrixLabels[rowIndex]}>
                  <th>{confusionMatrixLabels[rowIndex]}</th>

                  {row.map((value, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={rowIndex === colIndex ? "cm-diagonal" : ""}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =================================================
              NORMALIZED CONFUSION MATRIX
              ================================================= */}

        <div className="normalized-confusion">
          <h3>Normalized Confusion Matrix</h3>

          <p className="confusion-subtitle">
            Row-normalized classification results
          </p>

          <div className="confusion-table-wrapper">
            <table className="confusion-table normalized">
              <thead>
                <tr>
                  <th>Actual \ Predicted</th>

                  {confusionMatrixLabels.map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {normalizedConfusionMatrix.map((row, rowIndex) => (
                  <tr key={confusionMatrixLabels[rowIndex]}>
                    <th>{confusionMatrixLabels[rowIndex]}</th>

                    {row.map((value, colIndex) => (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className={rowIndex === colIndex ? "cm-diagonal" : ""}
                      >
                        {(value * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* =================================================
            CLASS-WISE PERFORMANCE
            ================================================= */}

        <div className="class-performance">
          <div className="card-label">CLASS-WISE PERFORMANCE</div>

          <h3>Classification Report</h3>

          <p className="confusion-subtitle">
            Precision, recall, F1-score and support by class
          </p>

          <div className="class-performance-table">
            <div className="class-performance-row class-performance-header">
              <span>Class</span>
              <span>Precision</span>
              <span>Recall</span>
              <span>F1</span>
              <span>Support</span>
            </div>

            {classPerformance.map((item) => (
              <div className="class-performance-row" key={item.name}>
                <span className="class-performance-name">{item.name}</span>

                <span>{(item.precision * 100).toFixed(2)}%</span>

                <span>{(item.recall * 100).toFixed(2)}%</span>

                <span>{(item.f1 * 100).toFixed(2)}%</span>

                <span>{item.support}</span>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================
            CONFUSION MATRIX NOTE
            ================================================= */}
        {/* =================================================
            ROC / PRECISION-RECALL ANALYSIS
            ================================================= */}

        <div className="curve-analysis">
          <div className="card-label">THRESHOLD ANALYSIS</div>

          <h3>ROC & Precision-Recall Analysis</h3>

          <p className="confusion-subtitle">
            Final XGBoost one-vs-rest evaluation on the held-out test set
          </p>

          <div className="curve-grid">
            <div className="curve-card">
              <h4>ROC Curves</h4>

              <p>
                Macro ROC-AUC: <strong>0.9875</strong>
              </p>

              <img
                src="/final_xgboost_roc.png"
                alt="Final XGBoost one-vs-rest ROC curves"
              />
              <a className="chart-link" href="/final_xgboost_roc.png" target="_blank" rel="noreferrer">
                View full-size ROC chart <Icon name="arrow" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>

            <div className="curve-card">
              <h4>Precision-Recall Curves</h4>

              <p>
                Macro Average Precision: <strong>0.9385</strong>
              </p>

              <img
                src="/final_xgboost_pr.png"
                alt="Final XGBoost one-vs-rest precision-recall curves"
              />
              <a className="chart-link" href="/final_xgboost_pr.png" target="_blank" rel="noreferrer">
                View full-size precision-recall chart <Icon name="arrow" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>

          <div className="curve-note">
            These curves describe model discrimination on the held-out test set.
            They are evaluation outputs and do not represent clinical
            validation.
          </div>
        </div>

        <div className="confusion-note">
          Rows represent actual classes and columns represent predicted classes.
          The normalized matrix shows the proportion of each actual class
          assigned to each predicted class.
        </div>
      </div>
    </section>
  );
}
