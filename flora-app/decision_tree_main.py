from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from decision_tree_model import (
    build_decision_tree, explain_prediction,
    get_tree_rules, dt_feature_importance, FEATURES
)

app = FastAPI(title="Flora Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

dt_model, dt_mae, _ = build_decision_tree()

class AnswerRequest(BaseModel):
    answers: Dict[str, int]
    user_id: Optional[str] = None

@app.get("/")
def root():
    return {"status": "Flora backend running"}

@app.post("/api/explain")
def explain_score(req: AnswerRequest):
    if not req.answers:
        raise HTTPException(400, "No answers provided")
    missing = [f for f in FEATURES if f not in req.answers]
    if missing:
        raise HTTPException(400, f"Missing features: {missing}")
    result = explain_prediction(dt_model, req.answers)
    return {**result, "algorithm": "Decision Tree (max_depth=5)", "mae": round(dt_mae, 2)}

@app.get("/api/explain/importance")
def get_importance():
    return {"decision_tree": dt_feature_importance(dt_model)}

@app.get("/api/explain/rules")
def get_rules():
    return {"rules": get_tree_rules(dt_model),
            "total_leaves": int(dt_model.get_n_leaves()),
            "max_depth": int(dt_model.get_depth())}
