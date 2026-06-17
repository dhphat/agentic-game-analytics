import pandas as pd
import random
from faker import Faker
from datetime import datetime, timedelta

def generate_mock_data(num_users=1000):
    fake = Faker()
    
    # 1. Generate Core Users Pool
    user_ids = [f"U{str(i).zfill(5)}" for i in range(1, num_users + 1)]
    
    # Generate users_segment.csv
    users_data = []
    vip_tiers = ["Free", "Bronze", "Silver", "Gold"]
    statuses = ["Active", "Churned"]
    
    for uid in user_ids:
        users_data.append({
            "user_id": uid,
            "join_date": fake.date_between(start_date="-2y", end_date="today").strftime("%Y-%m-%d"),
            "level": random.randint(1, 100),
            "total_playtime_hours": round(random.uniform(5.0, 500.0), 1),
            "vip_tier": random.choices(vip_tiers, weights=[0.6, 0.2, 0.15, 0.05])[0],
            "status": random.choices(statuses, weights=[0.8, 0.2])[0]
        })
        
    users_df = pd.DataFrame(users_data)
    users_df.to_csv("users_segment.csv", index=False)
    print("Generated users_segment.csv")

    # Generate payments.csv
    payments_data = []
    items = ["Battle Pass", "Gems", "Skins", "Starter Pack", "Loot Box"]
    
    # Not all users pay, but some pay multiple times
    paying_users = random.sample(user_ids, int(num_users * 0.4)) # 40% of users are paying
    
    for i in range(1, int(num_users * 1.5)): # Generate ~1.5x payments relative to total users
        uid = random.choice(paying_users)
        payments_data.append({
            "transaction_id": f"TXN{str(i).zfill(6)}",
            "user_id": uid,
            "payment_date": fake.date_between(start_date="-1y", end_date="today").strftime("%Y-%m-%d"),
            "amount_usd": round(random.uniform(0.99, 99.99), 2),
            "item_purchased": random.choice(items)
        })
        
    payments_df = pd.DataFrame(payments_data)
    payments_df.to_csv("payments.csv", index=False)
    print("Generated payments.csv")

    # Generate surveys.csv
    surveys_data = []
    categories = ["Bugs", "Gameplay", "Pricing", "Matchmaking", "Graphics"]
    
    for i in range(1, int(num_users * 0.3)): # ~30% of users leave feedback
        uid = random.choice(user_ids)
        surveys_data.append({
            "survey_id": f"SRV{str(i).zfill(5)}",
            "user_id": uid,
            "survey_date": fake.date_between(start_date="-6m", end_date="today").strftime("%Y-%m-%d"),
            "rating": random.randint(1, 5),
            "feedback_text": fake.sentence(nb_words=10),
            "category": random.choice(categories)
        })
        
    surveys_df = pd.DataFrame(surveys_data)
    surveys_df.to_csv("surveys.csv", index=False)
    print("Generated surveys.csv")

if __name__ == "__main__":
    generate_mock_data()
