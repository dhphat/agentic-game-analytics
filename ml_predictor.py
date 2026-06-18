import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os
from db import load_all_data


class MLPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        self.label_encoders = {}
        
    def _prepare_data(self):
        # Load data via centralized db loader (Supabase or CSV fallback)
        try:
            users_df, payments_df, _ = load_all_data()
            
            # Aggregate payments
            revenue_per_user = payments_df.groupby("user_id")["amount_usd"].sum().reset_index()
            
            # Merge
            df = users_df.merge(revenue_per_user, on="user_id", how="left")
            df["amount_usd"] = df["amount_usd"].fillna(0)
            
            # Feature Engineering
            df["is_churned"] = (df["status"] == "Churned").astype(int)
            
            # Encode categorical features
            le_vip = LabelEncoder()
            df["vip_tier_encoded"] = le_vip.fit_transform(df["vip_tier"])
            self.label_encoders["vip_tier"] = le_vip
            
            features = ["level", "total_playtime_hours", "amount_usd", "vip_tier_encoded"]
            
            return df, features
        except Exception as e:
            print(f"Error preparing data for ML: {e}")
            return None, None

            
    def train(self):
        df, features = self._prepare_data()
        if df is None:
            return False
            
        X = df[features]
        y = df["is_churned"]
        
        self.model.fit(X, y)
        self.is_trained = True
        return True
        
    def predict_high_risk_users(self, top_n=10):
        if not self.is_trained:
            self.train()
            
        df, features = self._prepare_data()
        if df is None:
            return []
            
        # Only predict for Active users
        active_users = df[df["status"] == "Active"].copy()
        if active_users.empty:
            return []
            
        X_active = active_users[features]
        
        # Get probability of class 1 (Churn)
        churn_probs = self.model.predict_proba(X_active)[:, 1]
        active_users["churn_risk_score"] = churn_probs * 100
        
        # Sort by highest risk
        high_risk = active_users.sort_values(by="churn_risk_score", ascending=False).head(top_n)
        
        # Format for UI
        results = []
        for _, row in high_risk.iterrows():
            results.append({
                "user_id": row["user_id"],
                "level": int(row["level"]),
                "vip_tier": row["vip_tier"],
                "total_playtime_hours": float(row["total_playtime_hours"]),
                "risk_score": float(row["churn_risk_score"])
            })
            
        return results
