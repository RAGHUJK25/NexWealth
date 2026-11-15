"""Per-user cash-flow forecasting with a time-ordered Random Forest model.

A separate model is trained for each authenticated user. The model predicts
next-day income and expenses from lagged/rolling transaction aggregates.
"""
from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MIN_HISTORY_DAYS = 45
MIN_TRAIN_ROWS = 20


def model_path(user_id: int) -> Path:
    return MODEL_DIR / f"user_{int(user_id)}.joblib"


def daily_series(transactions: Iterable) -> list[dict]:
    rows = list(transactions)
    if not rows:
        return []
    first = min(t.date for t in rows)
    last = max(date.today(), max(t.date for t in rows))
    totals = {}
    for tx in rows:
        item = totals.setdefault(tx.date, {"income": 0.0, "expenses": 0.0})
        if tx.type == "income":
            item["income"] += float(tx.amount)
        elif tx.type == "expense":
            item["expenses"] += float(tx.amount)
    result = []
    day = first
    while day <= last:
        item = totals.get(day, {"income": 0.0, "expenses": 0.0})
        result.append({
            "date": day,
            "income": float(item["income"]),
            "expenses": float(item["expenses"]),
            "net": float(item["income"] - item["expenses"]),
        })
        day += timedelta(days=1)
    return result


def _features(history: list[dict], target_date: date) -> list[float]:
    # All features use dates strictly before target_date.
    def lag(field: str, days: int) -> float:
        idx = len(history) - days
        return float(history[idx][field]) if idx >= 0 else 0.0

    def avg(field: str, days: int) -> float:
        vals = [float(x[field]) for x in history[-days:]]
        return float(np.mean(vals)) if vals else 0.0

    return [
        lag("income", 1), lag("income", 7), lag("expenses", 1),
        lag("expenses", 7), lag("net", 1), lag("net", 7),
        avg("income", 7), avg("income", 30),
        avg("expenses", 7), avg("expenses", 30),
        avg("net", 7), avg("net", 30),
        float(target_date.weekday()), float(target_date.month),
        float(target_date.day),
    ]


def training_matrix(series: list[dict]):
    features, targets = [], []
    # A 30-day lookback gives the model some short-term spending context.
    for idx in range(30, len(series)):
        features.append(_features(series[:idx], series[idx]["date"]))
        targets.append([series[idx]["income"], series[idx]["expenses"]])
    return np.asarray(features, dtype=float), np.asarray(targets, dtype=float)


def train_user_model(transactions, user_id: int) -> dict:
    series = daily_series(transactions)
    if len(series) < MIN_HISTORY_DAYS:
        raise ValueError(
            f"At least {MIN_HISTORY_DAYS} calendar days of transaction history are needed. "
            f"Your account currently covers {len(series)} days. Add/import more history and try again."
        )
    X, y = training_matrix(series)
    if len(X) < MIN_TRAIN_ROWS:
        raise ValueError("There is not enough usable history to train this model yet.")

    split = max(1, int(len(X) * 0.8))
    if len(X) - split < 3:
        raise ValueError("Add more transaction history to create a reliable time-based test set.")

    # Keep chronology intact: train on earlier observations, test on later ones.
    test_model = RandomForestRegressor(
        n_estimators=160, max_depth=8, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    test_model.fit(X[:split], y[:split])
    test_predictions = np.maximum(test_model.predict(X[split:]), 0)
    income_mae = float(mean_absolute_error(y[split:, 0], test_predictions[:, 0]))
    expense_mae = float(mean_absolute_error(y[split:, 1], test_predictions[:, 1]))

    model = RandomForestRegressor(
        n_estimators=200, max_depth=8, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    model.fit(X, y)
    payload = {
        "model": model,
        "trained_until": series[-1]["date"].isoformat(),
        "history_days": len(series),
        "training_rows": len(X),
        "income_mae": income_mae,
        "expense_mae": expense_mae,
        "feature_version": 1,
    }
    joblib.dump(payload, model_path(user_id))
    return {
        "status": "trained",
        "algorithm": "RandomForestRegressor",
        "history_days": len(series),
        "training_rows": len(X),
        "test_income_mae": round(income_mae, 2),
        "test_expense_mae": round(expense_mae, 2),
        "trained_until": payload["trained_until"],
        "note": "MAE is measured on later historical days held out from training; it is not a guarantee of future accuracy."
    }


def model_status(user_id: int) -> dict:
    path = model_path(user_id)
    if not path.exists():
        return {"trained": False, "algorithm": None, "message": "No personal ML model has been trained yet."}
    try:
        payload = joblib.load(path)
        return {
            "trained": True,
            "algorithm": "RandomForestRegressor",
            "trained_until": payload.get("trained_until"),
            "history_days": payload.get("history_days"),
            "training_rows": payload.get("training_rows"),
            "test_income_mae": round(float(payload.get("income_mae", 0)), 2),
            "test_expense_mae": round(float(payload.get("expense_mae", 0)), 2),
        }
    except Exception:
        return {"trained": False, "algorithm": None, "message": "Saved model could not be loaded. Train it again."}


def predict_30_days(transactions, user_id: int) -> dict | None:
    path = model_path(user_id)
    if not path.exists():
        return None
    payload = joblib.load(path)
    if payload.get("feature_version") != 1:
        return None
    series = daily_series(transactions)
    if not series:
        return None
    model = payload["model"]
    start_balance = sum(
        float(t.amount) if t.type == "income" else -float(t.amount)
        for t in transactions
    )
    history = list(series)
    daily_predictions = []
    total_income = 0.0
    total_expenses = 0.0
    for offset in range(1, 31):
        target_day = date.today() + timedelta(days=offset)
        x = np.asarray([_features(history, target_day)], dtype=float)
        pred = np.maximum(model.predict(x)[0], 0)
        income, expenses = float(pred[0]), float(pred[1])
        total_income += income
        total_expenses += expenses
        daily_predictions.append({
            "date": target_day.isoformat(),
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "net": round(income - expenses, 2),
        })
        history.append({
            "date": target_day, "income": income,
            "expenses": expenses, "net": income - expenses
        })
    return {
        "current_balance": round(start_balance, 2),
        "predicted_income_30_days": round(total_income, 2),
        "predicted_expenses_30_days": round(total_expenses, 2),
        "projected_balance_30_days": round(start_balance + total_income - total_expenses, 2),
        "daily_predictions": daily_predictions,
        "algorithm": "RandomForestRegressor",
        "trained_until": payload.get("trained_until"),
        "test_income_mae": round(float(payload.get("income_mae", 0)), 2),
        "test_expense_mae": round(float(payload.get("expense_mae", 0)), 2),
        "method": "Personalized 30-day forecast from a per-user Random Forest model. Predictions are estimates, not guarantees."
    }
