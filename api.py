from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
from agents import SQLAgent, VizAgent, InsightAgent
from dotenv import load_dotenv

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sql_agent = SQLAgent()
insight_agent = InsightAgent()

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    last_sql: str = None
    last_user_ids: list = []

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        msg_lower = req.message.lower()
        
        # Intercept Machine Learning / Predict Churn intents
        if ("predict" in msg_lower and "churn" in msg_lower) or ("dự đoán" in msg_lower and "rời bỏ" in msg_lower) or ("mô hình học máy" in msg_lower) or ("machine learning" in msg_lower):
            return await predict_churn(req.language)
            
        # 1. Generate SQL
        sql_query = sql_agent.generate_sql(req.message, req.last_sql, req.last_user_ids)
        
        if sql_query == "CONVERSATIONAL_QUERY":
            if req.language == "vi":
                reply = "Xin chào! Tôi là Trợ lý AI chuyên phân tích dữ liệu Game của bạn.\n\nTôi có thể:\n- 📊 Truy vấn và phân tích dữ liệu (Người chơi, Doanh thu, Sự kiện) bằng ngôn ngữ tự nhiên.\n- 📈 Vẽ 6 loại biểu đồ tự động (Cột, Đường, Tròn, Vùng, Phân tán, Mạng nhện).\n- 🤖 Chạy mô hình Học máy để dự đoán tỷ lệ rời bỏ (/predict churn).\n- 💡 Tự động đúc kết các Insight kinh doanh sâu sắc.\n\nBạn muốn tôi phân tích điều gì hôm nay?"
                suggestions = ["Doanh thu theo ngày?", "Vẽ biểu đồ mạng nhện VIP", "/predict churn"]
            else:
                reply = "Hello! I am your AI Game Analytics Assistant.\n\nI can:\n- 📊 Query and analyze game data using natural language.\n- 📈 Generate 6 types of charts automatically.\n- 🤖 Run Machine Learning models to predict churn (/predict churn).\n- 💡 Provide deep business insights based on data.\n\nWhat would you like to analyze today?"
                suggestions = ["Revenue by date?", "Radar chart of VIPs", "/predict churn"]
                
            return {
                "sql": "-- Conversational Query",
                "data": [],
                "chartConfig": None,
                "insight": reply,
                "suggestedQuestions": suggestions
            }
        
        # 2. Execute SQL
        df = sql_agent.execute_sql(sql_query)
        
        # Format dataframe to list of dicts (handling NaN/Inf for JSON)
        df_clean = df.replace([np.inf, -np.inf, np.nan], None)
        data = df_clean.to_dict(orient="records")
        
        # 3. Determine Chart Config
        chart_config = None
        if len(df.columns) >= 2:
            num_cols = df.select_dtypes(include=['number']).columns.tolist()
            cat_cols = df.select_dtypes(exclude=['number']).columns.tolist()
            if cat_cols and num_cols:
                x_col = cat_cols[0]
                y_col = num_cols[0]
                msg_lower = req.message.lower()
                if 'pie' in msg_lower or 'tròn' in msg_lower:
                    chart_config = {"type": "pie", "xKey": x_col, "yKey": y_col}
                elif 'scatter' in msg_lower or 'phân tán' in msg_lower:
                    chart_config = {"type": "scatter", "xKey": x_col, "yKey": y_col}
                elif 'radar' in msg_lower or 'mạng nhện' in msg_lower:
                    chart_config = {"type": "radar", "xKey": x_col, "yKey": y_col}
                elif 'area' in msg_lower or 'vùng' in msg_lower:
                    chart_config = {"type": "area", "xKey": x_col, "yKey": y_col}
                elif 'bar' in msg_lower or 'cột' in msg_lower:
                    chart_config = {"type": "bar", "xKey": x_col, "yKey": y_col}
                elif 'line' in msg_lower or 'đường' in msg_lower or 'trend' in msg_lower or 'over time' in msg_lower or 'date' in x_col.lower():
                    chart_config = {"type": "line", "xKey": x_col, "yKey": y_col}
                else:
                    chart_config = {"type": "bar", "xKey": x_col, "yKey": y_col}
            elif len(num_cols) >= 2:
                chart_config = {"type": "bar", "xKey": num_cols[0], "yKey": num_cols[1]}
                
        # 4. Generate Insight & Suggested Questions
        insight_data = insight_agent.generate_insight(req.message, df, req.language)
        
        return {
            "sql": sql_query,
            "data": data,
            "chartConfig": chart_config,
            "insight": insight_data.get("insight", "Insight not available."),
            "suggestedQuestions": insight_data.get("suggested_questions", [])
        }
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            friendly_error = (
                "Hệ thống AI đang bị quá tải do đạt giới hạn miễn phí của Google Gemini (15 request/phút). Vui lòng đợi khoảng 30-60 giây rồi thử lại nhé!" 
                if req.language == "vi" 
                else "The AI system is currently overloaded due to Google Gemini's free tier rate limits (15 requests/minute). Please wait 30-60 seconds and try again!"
            )
        else:
            friendly_error = (
                f"Đã xảy ra lỗi hệ thống: {error_str}" 
                if req.language == "vi" 
                else f"A system error occurred: {error_str}"
            )
            
        return {
            "error": error_str, 
            "sql": "-- Error execution stopped", 
            "data": [], 
            "insight": friendly_error,
            "chartConfig": None,
            "suggestedQuestions": []
        }

from ml_predictor import MLPredictor
import random
import time

ml_predictor = MLPredictor()
# Pre-train the model
ml_predictor.train()

class ActionRequest(BaseModel):
    user_ids: list[str]
    action_type: str
    
@app.get("/api/predict-churn")
async def predict_churn(language: str = "en"):
    try:
        high_risk = ml_predictor.predict_high_risk_users(top_n=10)
        
        if language == "vi":
            return {
                "sql": "-- Mô hình Máy học: RandomForestClassifier\n-- Dự đoán xác suất 'Churned' dựa trên hành vi của người chơi (Level, Giờ chơi, Doanh thu, Hạng VIP).",
                "data": high_risk,
                "chartConfig": None,
                "insight": "Mô hình Máy học đã xác định những người chơi này có nguy cơ rất cao sẽ rời bỏ game trong tương lai gần dựa trên thói quen chơi và chi tiêu của họ.",
                "suggestedQuestions": ["Phân tích hành vi của nhóm High Risk này?", "Tạo chiến dịch tặng quà cho nhóm này?"],
                "action": {
                    "label": "Gửi Offer tặng 500 Gems",
                    "actionType": "send_giftcode",
                    "targetUserIds": [user["user_id"] for user in high_risk]
                }
            }
        
        return {
            "sql": "-- Machine Learning Model: RandomForestClassifier\n-- Predicting 'Churned' probability based on active users' features (Level, Playtime, Revenue, VIP Tier).",
            "data": high_risk,
            "chartConfig": None,
            "insight": "The Machine Learning model has identified these active users as having a high probability of churning soon based on their playtime and spending patterns.",
            "suggestedQuestions": ["Analyze the behavior of this High Risk group?", "Create a retention campaign for them?"],
            "action": {
                "label": "Send 500 Gems Retention Offer",
                "actionType": "send_giftcode",
                "targetUserIds": [user["user_id"] for user in high_risk]
            }
        }
    except Exception as e:
        return {"error": str(e)}

from anomaly_detector import detect_anomalies

@app.get("/api/anomalies")
async def get_anomalies():
    # Call the real anomaly detection engine
    anomalies = detect_anomalies()
    return {"anomalies": anomalies}

@app.post("/api/action/send-giftcode")
async def send_giftcode(req: ActionRequest):
    # Simulate action processing
    time.sleep(1.5)
    return {
        "status": "success",
        "message": f"Successfully sent Apology Email and Giftcode to {len(req.user_ids)} users."
    }

