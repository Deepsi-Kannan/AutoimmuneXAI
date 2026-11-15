import numpy as np
import pandas as pd
import shap


def explain_prediction(
    pipeline,
    label_encoder,
    input_df,
    top_n=5
):
    """
    Generate a local SHAP explanation for one prediction.

    This explains model behavior only.
    It is not a clinical explanation or diagnosis.
    """

    # -----------------------------------------------------
    # Get preprocessing and XGBoost model
    # -----------------------------------------------------

    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    # -----------------------------------------------------
    # Transform input using the same preprocessing
    # -----------------------------------------------------

    transformed_input = preprocessor.transform(
        input_df
    )

    feature_names = (
        preprocessor
        .get_feature_names_out()
    )

    # -----------------------------------------------------
    # Create SHAP explainer
    # -----------------------------------------------------

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(
        transformed_input
    )

    # -----------------------------------------------------
    # Get prediction
    # -----------------------------------------------------

    predicted_index = pipeline.predict(
        input_df
    )[0]

    predicted_class = label_encoder.inverse_transform(
        [predicted_index]
    )[0]

    # -----------------------------------------------------
    # Multiclass SHAP values
    # Expected shape:
    # (samples, features, classes)
    # -----------------------------------------------------

    shap_array = np.asarray(shap_values)

    predicted_class_values = shap_array[
        0,
        :,
        predicted_index
    ]

    # -----------------------------------------------------
    # Build explanation table
    # -----------------------------------------------------

    explanation_df = pd.DataFrame({
        "feature": feature_names,
        "shap_value": predicted_class_values
    })

    explanation_df["absolute_shap"] = (
        explanation_df["shap_value"].abs()
    )

    # -----------------------------------------------------
    # Features supporting prediction
    # -----------------------------------------------------

    positive = (
        explanation_df[
            explanation_df["shap_value"] > 0
        ]
        .sort_values(
            "shap_value",
            ascending=False
        )
        .head(top_n)
    )

    # -----------------------------------------------------
    # Features opposing prediction
    # -----------------------------------------------------

    negative = (
        explanation_df[
            explanation_df["shap_value"] < 0
        ]
        .sort_values(
            "shap_value",
            ascending=True
        )
        .head(top_n)
    )

    # -----------------------------------------------------
    # Return JSON-safe result
    # -----------------------------------------------------

    return {
        "predicted_class": predicted_class,

        "positive_contributions": [
            {
                "feature": row["feature"],
                "shap_value": float(
                    row["shap_value"]
                )
            }
            for _, row in positive.iterrows()
        ],

        "negative_contributions": [
            {
                "feature": row["feature"],
                "shap_value": float(
                    row["shap_value"]
                )
            }
            for _, row in negative.iterrows()
        ],

        "disclaimer": (
            "SHAP values describe the contribution "
            "of features to the machine-learning "
            "model output. They do not establish "
            "causality and are not clinical explanations."
        )
    }
