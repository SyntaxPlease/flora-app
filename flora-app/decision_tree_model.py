"""
ADD THIS CODE TO THE BOTTOM OF YOUR EXISTING model.py
------------------------------------------------------
Decision Tree for Flora App — explainable gut health scoring.

Why Decision Tree?
  XGBoost is accurate but a "black box" — you cannot explain WHY
  a user got score 62 instead of 71.  A Decision Tree is fully
  interpretable: you can trace the exact sequence of yes/no splits
  that led to the prediction and show it to the user step by step.

What this adds:
  1. build_decision_tree()  – trains a shallow DecisionTreeRegressor
                               on the same synthetic dataset as XGBoost
  2. explain_prediction()   – returns the full decision PATH for one user:
                               which feature was checked at each node,
                               which way the answer sent them (left/right),
                               and what score the leaf predicts
  3. get_tree_rules()       – exports the entire tree as human-readable
                               IF/ELIF text (useful for a debug panel)

Key concept for your teacher:
  max_depth=5 is deliberate.  A deeper tree memorises the training data
  (overfits); a depth-5 tree generalises well AND stays readable — only
  5 decisions between root and leaf.
"""

from sklearn.tree import DecisionTreeRegressor, export_text
from sklearn.metrics import mean_absolute_error as _mae


# ── TRAINING ────────────────────────────────────────────────────────

DT_PARAMS = {
    "max_depth":        5,      # shallow = explainable + avoids overfitting
    "min_samples_leaf": 20,     # each leaf must have ≥20 training samples
    "random_state":     42,
}


def build_decision_tree():
    """
    Train a DecisionTreeRegressor to predict the overall gut health score.

    Uses the same _generate_dataset() already defined in model.py so the
    training distribution exactly matches XGBoost.

    Returns:
        dt        – trained DecisionTreeRegressor
        dt_mae    – mean absolute error on test split (float)
        feature_names – ordered list of feature names (== FEATURES)
    """
    print("Training Decision Tree regressor ...")
    X, y_dict = _generate_dataset(n=5000)
    y_overall = y_dict["overall"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y_overall, test_size=0.15, random_state=42
    )

    dt = DecisionTreeRegressor(**DT_PARAMS)
    dt.fit(X_tr, y_tr)

    preds  = dt.predict(X_te)
    dt_mae = float(_mae(y_te, preds))
    print(f"  [decision_tree]  MAE = {dt_mae:.2f}  (XGBoost for comparison)")

    return dt, dt_mae, FEATURES   # FEATURES already defined in model.py


# ── DECISION PATH EXPLANATION ────────────────────────────────────────

def explain_prediction(dt, answers: dict) -> dict:
    """
    Trace the exact path through the tree for one user's answers.

    Each step in the returned path tells you:
      - which feature was tested  (e.g. "sleep")
      - the threshold value       (e.g. 0.5)  [in normalised 0-1 space]
      - the user's actual value   (e.g. 0.83 → "went RIGHT → good")
      - a plain-English sentence  (e.g. "Sleep ≥ 0.5 → healthy range ✓")

    Args:
        dt      – trained DecisionTreeRegressor
        answers – dict of feature_name → raw integer value

    Returns dict with:
        predicted_score  – float, the leaf's predicted gut score
        path             – list of step dicts (one per split in the path)
        leaf_node_id     – int, which leaf was reached
        depth_reached    – int, how many splits were traversed
        summary          – one-sentence plain-English explanation
    """
    # Normalise answers to [0,1] — same as _norm() in model.py
    norm = {
        k: (v - MIN_V[k]) / (MAX_V[k] - MIN_V[k])
        for k, v in answers.items()
        if k in MIN_V
    }

    # Build the feature vector in FEATURES order
    X = [[norm.get(f, 0.5) for f in FEATURES]]

    # sklearn's decision_path returns a sparse indicator matrix
    # shape: (1, n_nodes) — True at each node the sample visited
    node_indicator = dt.decision_path(X)
    leaf_id        = int(dt.apply(X)[0])
    predicted_score = float(np.clip(dt.predict(X)[0], 0, 100))

    # Pull the tree structure arrays
    tree          = dt.tree_
    feature_idx   = tree.feature        # which feature at each node (-2 = leaf)
    thresholds    = tree.threshold      # split threshold at each node
    children_left = tree.children_left
    node_ids      = node_indicator.indices  # nodes visited (sparse → dense)

    path_steps = []
    for node_id in node_ids:
        if feature_idx[node_id] == -2:
            # Leaf node — no split here
            break

        feat_i     = feature_idx[node_id]
        feat_name  = FEATURES[feat_i]
        threshold  = float(thresholds[node_id])
        user_val   = float(X[0][feat_i])

        # Determine which branch the user took
        went_left  = (user_val <= threshold)
        direction  = "left (below threshold)" if went_left else "right (above threshold)"

        # Convert normalised threshold back to raw scale for display
        raw_min    = MIN_V.get(feat_name, 0)
        raw_max    = MAX_V.get(feat_name, 1)
        raw_thresh = round(threshold * (raw_max - raw_min) + raw_min, 2)
        raw_user   = round(user_val  * (raw_max - raw_min) + raw_min, 2)

        # Plain-English label
        label = feat_name.replace("_", " ").title()
        if went_left:
            sentence = f"{label} = {raw_user} ≤ {raw_thresh} → needs improvement"
            status   = "warning"
        else:
            sentence = f"{label} = {raw_user} > {raw_thresh} → healthy range ✓"
            status   = "good"

        path_steps.append({
            "node_id":         int(node_id),
            "feature":         feat_name,
            "feature_label":   label,
            "threshold_norm":  round(threshold, 4),
            "threshold_raw":   raw_thresh,
            "user_value_norm": round(user_val, 4),
            "user_value_raw":  raw_user,
            "went_left":       went_left,
            "direction":       direction,
            "sentence":        sentence,
            "status":          status,   # "good" | "warning"
        })

    # Build one-sentence summary from the most impactful split (first split)
    top_feature = path_steps[0]["feature_label"] if path_steps else "your answers"
    summary = (
        f"The tree split first on '{top_feature}', "
        f"then followed {len(path_steps)} decision steps "
        f"to predict a gut health score of {round(predicted_score)}/100."
    )

    return {
        "predicted_score": round(predicted_score),
        "path":            path_steps,
        "leaf_node_id":    leaf_id,
        "depth_reached":   len(path_steps),
        "summary":         summary,
    }


# ── FULL TREE AS HUMAN-READABLE TEXT ────────────────────────────────

def get_tree_rules(dt) -> str:
    """
    Export the entire decision tree as an IF / ELIF text block.
    Useful for a debug panel or for printing in your project report.

    Example output:
      |--- sleep <= 0.50
      |   |--- stress <= 0.33
      |   |   |--- value: [41.2]
      |   |--- stress >  0.33
      |   |   |--- value: [58.7]
      |--- sleep >  0.50
      ...

    Returns:
        rules_text – multi-line string
    """
    return export_text(dt, feature_names=list(FEATURES), decimals=2)


# ── FEATURE IMPORTANCE (from DT) ────────────────────────────────────

def dt_feature_importance(dt) -> list:
    """
    Return feature importances as a sorted list of dicts.
    Decision Tree importances are based on Gini impurity reduction —
    different from XGBoost's gain-based importances, so comparing
    the two is interesting to show your teacher.

    Returns:
        list of {"feature": str, "label": str, "importance": float}
        sorted highest → lowest
    """
    importances = dt.feature_importances_
    ranked = sorted(
        [
            {
                "feature":    FEATURES[i],
                "label":      FEATURES[i].replace("_", " ").title(),
                "importance": round(float(importances[i]), 4),
            }
            for i in range(len(FEATURES))
        ],
        key=lambda x: -x["importance"],
    )
    return ranked
