import pandas as pd
from db import load_all_data

def detect_anomalies():
    anomalies = []
    
    try:
        # Load all data via centralized db loader (Supabase or CSV fallback)
        users_df, payments_df, surveys_df = load_all_data()

        # 1. Detect Spike in 1-Star Reviews mentioning Bugs
        bad_reviews = surveys_df[surveys_df["rating"] == 1]
        bug_mentions = bad_reviews[bad_reviews["feedback_text"].str.contains("bug|lag|crash|error|freeze", case=False, na=False)]
        
        # We will trigger the anomaly if there are more than 15 bad reviews (currently around 14 in mock data)
        # So you can trigger it by adding more!
        threshold = 15
        if len(bug_mentions) >= threshold:
            user_ids = bug_mentions["user_id"].unique().tolist()[:5]
            anomalies.append({
                "id": "ANOM-REAL-001",
                "title": "Spike in 1-Star Bug Reports",
                "description": f"Real Data Alert: Detected {len(bug_mentions)} recent 1-star reviews mentioning bugs/crashes (Threshold: {threshold}).",
                "severity": "critical",
                "action": {
                    "label": "Send Apology Email & 500 Gems",
                    "actionType": "send_giftcode",
                    "targetUserIds": user_ids
                }
            })

        # 2. Detect VIP Spending Drop
        # (users_df and payments_df already loaded above)

        # Merge to get VIP tier for each payment
        df = payments_df.merge(users_df, on="user_id", how="inner")
        revenue_by_tier = df.groupby("vip_tier")["amount_usd"].sum()
        
        gold_rev = revenue_by_tier.get("Gold", 0)
        silver_rev = revenue_by_tier.get("Silver", 0)
        
        # If somehow Gold revenue is less than Silver, that's an anomaly!
        if gold_rev < silver_rev:
            anomalies.append({
                "id": "ANOM-REAL-002",
                "title": "VIP Spending Drop Detected",
                "description": f"Real Data Alert: Gold VIP total revenue (${gold_rev:,.0f}) has fallen below Silver tier (${silver_rev:,.0f}).",
                "severity": "high"
            })
            
    except Exception as e:
        print("Anomaly Detection Error:", e)
        
    return anomalies
