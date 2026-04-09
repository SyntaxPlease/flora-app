import numpy as np
from sklearn.tree import DecisionTreeRegressor, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error as _mae

FEATURES = [
    "fruits_veggies", "junk_food", "fermented", "water", "fiber",
    "sugar", "plant_diversity", "meal_timing", "alcohol", "antibiotics",
    "probiotics", "bloating", "acidity", "bristol", "bowel_freq",
    "fatigue", "skin", "food_intol", "nausea", "stress",
    "sleep", "exercise", "smoking", "mindful_eating", "outdoor_time"
]

MIN_V = {f: -2 for f in FEATURES}
MAX_V = {f:  2 for f in FEATURES}

POSITIVE = {"fruits_veggies","fermented","water","fiber","plant_diversity",
            "meal_timing","probiotics","bristol","bowel_freq","sleep",
            "exercise","mindful_eating","outdoor_time"}

def _generate_dataset(n=5000):
    rng = np.random.default_rng(42)
    X_raw = rng.integers(-2, 3, size=(n, len(FEATURES)))
    scores = []
    for row in X_raw:
        s = 50.0
        for i, f in enumerate(FEATURES):
            v = int(row[i])
            if f in POSITIVE:
                s += v * 4
            else:
                s -= v * 4
        scores.append(float(np.clip(s + rng.normal(0, 5), 0, 100)))
    X_norm = (X_raw - (-2)) / 4.0
    return X_norm, {"overall": np.array(scores)}

def build_decision_tree():
    print("Training Decision Tree regressor ...")
    X, y_dict = _generate_dataset(n=5000)
    y = y_dict["overall"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42)
    dt = DecisionTreeRegressor(max_depth=5, min_samples_leaf=20, random_state=42)
    dt.fit(X_tr, y_tr)
    mae = float(_mae(y_te, dt.predict(X_te)))
    print(f"  [decision_tree] MAE = {mae:.2f}")
    return dt, mae, FEATURES

def explain_prediction(dt, answers: dict) -> dict:
    norm = {k: (v - MIN_V[k]) / (MAX_V[k] - MIN_V[k]) for k, v in answers.items() if k in MIN_V}
    X = [[norm.get(f, 0.5) for f in FEATURES]]
    node_indicator = dt.decision_path(X)
    leaf_id = int(dt.apply(X)[0])
    predicted_score = float(np.clip(dt.predict(X)[0], 0, 100))
    tree = dt.tree_
    node_ids = node_indicator.indices
    path_steps = []
    for node_id in node_ids:
        if tree.feature[node_id] == -2:
            break
        feat_i = tree.feature[node_id]
        feat_name = FEATURES[feat_i]
        threshold = float(tree.threshold[node_id])
        user_val = float(X[0][feat_i])
        went_left = (user_val <= threshold)
        raw_min = MIN_V.get(feat_name, 0)
        raw_max = MAX_V.get(feat_name, 1)
        raw_thresh = round(threshold * (raw_max - raw_min) + raw_min, 2)
        raw_user = round(user_val * (raw_max - raw_min) + raw_min, 2)
        label = feat_name.replace("_", " ").title()
        if went_left:
            sentence = f"{label} = {raw_user} ≤ {raw_thresh} → needs improvement"
            status = "warning"
        else:
            sentence = f"{label} = {raw_user} > {raw_thresh} → healthy range ✓"
            status = "good"
        path_steps.append({
            "node_id": int(node_id), "feature": feat_name, "feature_label": label,
            "threshold_raw": raw_thresh, "user_value_raw": raw_user,
            "went_left": went_left, "sentence": sentence, "status": status,
        })
    top = path_steps[0]["feature_label"] if path_steps else "your answers"
    summary = f"The tree split first on '{top}', then followed {len(path_steps)} steps to predict {round(predicted_score)}/100."
    return {"predicted_score": round(predicted_score), "path": path_steps,
            "leaf_node_id": leaf_id, "depth_reached": len(path_steps), "summary": summary}

def get_tree_rules(dt) -> str:
    return export_text(dt, feature_names=list(FEATURES), decimals=2)

def dt_feature_importance(dt) -> list:
    return sorted([
        {"feature": FEATURES[i], "label": FEATURES[i].replace("_"," ").title(),
         "importance": round(float(dt.feature_importances_[i]), 4)}
        for i in range(len(FEATURES))
    ], key=lambda x: -x["importance"])
