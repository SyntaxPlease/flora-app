"""
ADD THIS CODE TO main.py
--------------------------
1. Update your model import at the top of main.py:

   from model import (
       build_decision_tree,
       explain_prediction,
       get_tree_rules,
       dt_feature_importance,
       FEATURES,
   )

2. Add the startup initialisation (Step 2) near your other model inits.
3. Paste the three endpoints (Step 3) with the other routes.
"""


# ── STEP 1: ADD TO YOUR IMPORTS ─────────────────────────────────────
#
#   from model import (
#       build_decision_tree, explain_prediction,
#       get_tree_rules, dt_feature_importance, FEATURES,
#   )
#


# ── STEP 2: ADD STARTUP INITIALISATION ──────────────────────────────
# Place alongside your XGBoost / Logistic / KNN initialisations.

dt_model, dt_mae, _ = build_decision_tree()


# ── STEP 3: PASTE THESE ENDPOINTS INTO main.py ──────────────────────

from pydantic import BaseModel
from typing import Dict, Optional


class ExplainRequest(BaseModel):
    answers: Dict[str, int]
    user_id: Optional[str] = None


# ── ENDPOINT 1: Full decision-path explanation ───────────────────────

@app.post("/api/explain")
def explain_score(req: ExplainRequest):
    """
    Decision Tree explanation endpoint.

    Given a user's 25 answers, returns the step-by-step path through
    the decision tree: which feature was checked at each node, whether
    the user's value was above/below the threshold, and what the final
    predicted score is.

    This is the "explainability" endpoint — use it to power a visual
    walkthrough in the frontend (e.g. a step-by-step card flow).

    Example request:
    {
      "answers": {
        "fruits_veggies": 1, "junk_food": -2, "fermented": 0,
        "water": 1, "fiber": -1, "sugar": -1, "plant_diversity": 1,
        "meal_timing": 0, "alcohol": 0, "antibiotics": 0,
        "probiotics": 1, "bloating": -1, "acidity": 0, "bristol": 1,
        "bowel_freq": 1, "fatigue": -1, "skin": 0, "food_intol": 0,
        "nausea": 0, "stress": -2, "sleep": 1, "exercise": 1,
        "smoking": 1, "mindful_eating": 0, "outdoor_time": 1
      }
    }

    Example response:
    {
      "predicted_score": 67,
      "depth_reached": 4,
      "summary": "The tree split first on 'Sleep', then followed 4 steps...",
      "path": [
        {
          "node_id": 0,
          "feature": "sleep",
          "feature_label": "Sleep",
          "threshold_raw": 0.0,
          "user_value_raw": 1,
          "went_left": false,
          "sentence": "Sleep = 1 > 0.0 → healthy range ✓",
          "status": "good"
        },
        ...
      ],
      "leaf_node_id": 42,
      "xgboost_score": 71,
      "score_gap": -4,
      "algorithm": "Decision Tree (max_depth=5)",
      "mae": 8.31
    }
    """
    if not req.answers:
        raise HTTPException(400, "No answers provided")

    missing = [f for f in FEATURES if f not in req.answers]
    if missing:
        raise HTTPException(
            400, f"Missing features: {missing}. All 25 features are required."
        )

    explanation = explain_prediction(dt_model, req.answers)

    # Also run XGBoost so the frontend can compare the two predictions
    xgb_result  = run_xgboost(req.answers)
    score_gap   = explanation["predicted_score"] - xgb_result["score100"]

    return {
        **explanation,
        "xgboost_score": xgb_result["score100"],
        "score_gap":     score_gap,
        "algorithm":     "Decision Tree (max_depth=5)",
        "mae":           round(dt_mae, 2),
    }


# ── ENDPOINT 2: Feature importance comparison ────────────────────────

@app.get("/api/explain/importance")
def get_importance_comparison():
    """
    Returns Decision Tree feature importances alongside XGBoost importances.

    This endpoint is ideal for a side-by-side bar chart in your frontend
    showing how the two algorithms rank the same 25 features differently.

    Decision Tree: importance = total Gini impurity reduction from splits on that feature
    XGBoost:       importance = total gain from splits on that feature

    They often agree on the top features but differ in the middle tier —
    that difference is a great talking point for your teacher.

    Example response:
    {
      "decision_tree": [
        {"feature": "sleep",         "label": "Sleep",         "importance": 0.1832},
        {"feature": "fruits_veggies","label": "Fruits Veggies","importance": 0.1541},
        ...
      ],
      "note": "DT importances = Gini reduction. XGBoost importances = gain-based."
    }
    """
    dt_imp = dt_feature_importance(dt_model)

    return {
        "decision_tree": dt_imp,
        "note": (
            "Decision Tree importances are based on Gini impurity reduction. "
            "XGBoost importances are gain-based. Comparing the two shows which "
            "features are consistently important across different algorithms."
        ),
    }


# ── ENDPOINT 3: Full tree rules (debug / report panel) ───────────────

@app.get("/api/explain/rules")
def get_rules():
    """
    Returns the entire decision tree as a human-readable IF/ELIF text block.

    Useful for:
      - Displaying in a debug panel in your app
      - Pasting into your project report to show the tree structure
      - Verifying the tree is not too deep / overfitting

    Example response snippet:
    {
      "rules": "|--- sleep <= 0.50\\n|   |--- stress <= 0.33\\n...",
      "total_leaves": 28,
      "max_depth": 5
    }
    """
    rules_text   = get_tree_rules(dt_model)
    total_leaves = int(dt_model.get_n_leaves())
    actual_depth = int(dt_model.get_depth())

    return {
        "rules":        rules_text,
        "total_leaves": total_leaves,
        "max_depth":    actual_depth,
        "note": (
            f"This tree has {total_leaves} leaves at depth {actual_depth}. "
            "Each leaf represents one possible combination of gut health inputs."
        ),
    }
