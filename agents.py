import os
import re
import pandas as pd
import duckdb
import plotly.express as px
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Initialize OpenAI key
openai_api_key = os.getenv("OPENAI_API_KEY")

def _openai_fallback(prompt: str) -> str:
    if not openai_api_key:
        raise RuntimeError("Gemini limit exceeded and OPENAI_API_KEY is not configured.")
    from openai import OpenAI
    client = OpenAI(api_key=openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    return response.choices[0].message.content

class SQLAgent:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.model = genai.GenerativeModel(model_name)
        
        # Define schemas
        self.schemas = """
        Table: users_segment
        Columns: user_id (VARCHAR), join_date (DATE), level (INTEGER), total_playtime_hours (FLOAT), vip_tier (VARCHAR), status (VARCHAR)
        
        Table: payments
        Columns: transaction_id (VARCHAR), user_id (VARCHAR), payment_date (DATE), amount_usd (FLOAT), item_purchased (VARCHAR)
        
        Table: surveys
        Columns: survey_id (VARCHAR), user_id (VARCHAR), survey_date (DATE), rating (INTEGER), feedback_text (VARCHAR), category (VARCHAR)
        """
        
    def generate_sql(self, natural_language_query: str, last_sql: str = None, last_user_ids: list = None) -> str:
        context_str = f"Previous SQL Query (use this as context if the user says 'for the above info' or asks for a different chart type): {last_sql}\n" if last_sql else ""
        
        user_ids_str = ""
        if last_user_ids and len(last_user_ids) > 0:
            formatted_ids = ", ".join([f"'{uid}'" for uid in last_user_ids])
            user_ids_str = f"IMPORTANT: The previous query returned these specific user IDs: ({formatted_ids}). ONLY use `user_id IN (...)` to filter by these IDs **IF AND ONLY IF** the user explicitly refers to them (e.g., 'this group', 'High Risk group', 'these users', 'they'). If the user asks a general question (e.g., 'how do users rate...', 'what is the total revenue'), you MUST IGNORE this list and query the entire table.\n"
        
        prompt = f"""
        You are an expert Data Engineer writing DuckDB SQL.
        Given the following database schemas:
        {self.schemas}
        
        {context_str}
        {user_ids_str}
        Write a valid DuckDB SQL query to answer this user question:
        "{natural_language_query}"
        
        IMPORTANT: 
        - ONLY return EXACTLY the string CONVERSATIONAL_QUERY if the user is ONLY greeting you (e.g., "hi", "hello", "xin chào") OR explicitly asking about your capabilities (e.g., "what can you do", "bạn làm được gì"). For ALL other analytical or data-related questions, even complex ones, you MUST write a DuckDB SQL query. If the question requires advanced analysis, approximate it with SQL aggregations.
        - Otherwise, Return ONLY the SQL query within ```sql ``` blocks.
        - Ensure correct table names.
        - ALWAYS fully qualify column names with their table names (e.g., users_segment.user_id) especially when using JOINs to avoid ambiguous column errors.
        - Do not use markdown other than the sql block.
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                print("Gemini limit exceeded. Falling back to OpenAI...")
                text = _openai_fallback(prompt)
            else:
                raise e
        
        # Extract SQL using regex
        sql_match = re.search(r"```\s*(?:sql)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if sql_match:
            return sql_match.group(1).strip()
        else:
            return text.strip().strip('`').strip()

    def execute_sql(self, sql: str) -> pd.DataFrame:
        con = duckdb.connect(database=':memory:')
        try:
            con.execute("CREATE VIEW users_segment AS SELECT * FROM read_csv_auto('users_segment.csv')")
            con.execute("CREATE VIEW payments AS SELECT * FROM read_csv_auto('payments.csv')")
            con.execute("CREATE VIEW surveys AS SELECT * FROM read_csv_auto('surveys.csv')")
            
            result_df = con.execute(sql).df()
            return result_df
        except Exception as e:
            raise RuntimeError(f"Error executing SQL: {e}\nSQL was:\n{sql}")
        finally:
            con.close()


class VizAgent:
    def __init__(self):
        pass
        
    def generate_chart(self, df: pd.DataFrame, query: str):
        if df.empty or len(df.columns) < 2:
            return None
            
        num_cols = df.select_dtypes(include=['number']).columns.tolist()
        cat_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
        
        if cat_cols and num_cols:
            x_col = cat_cols[0]
            y_col = num_cols[0]
            
            if len(df[x_col].unique()) <= 10:
                if 'trend' in query.lower() or 'over time' in query.lower() or 'date' in x_col.lower():
                    fig = px.line(df, x=x_col, y=y_col, title=f"{y_col} by {x_col}", template="plotly_dark")
                else:
                    fig = px.bar(df, x=x_col, y=y_col, title=f"{y_col} by {x_col}", template="plotly_dark", color=x_col)
            else:
                fig = px.scatter(df, x=x_col, y=y_col, title=f"{y_col} by {x_col}", template="plotly_dark")
            return fig
            
        elif len(num_cols) >= 2:
            fig = px.scatter(df, x=num_cols[0], y=num_cols[1], title=f"{num_cols[1]} vs {num_cols[0]}", template="plotly_dark")
            return fig
            
        return None

class InsightAgent:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.model = genai.GenerativeModel(model_name)
        
    def generate_insight(self, query: str, df: pd.DataFrame, language: str = "en") -> dict:
        if df.empty:
            data_sample = "No rows returned. The query yielded empty results."
            total_rows = 0
        else:
            data_sample = df.head(10).to_string()
            total_rows = len(df)
            
        lang_instruction = "Reply in Vietnamese." if language == "vi" else "Reply in English."
        
        prompt = f"""
        You are a Game Data Analyst.
        A user asked: "{query}"
        
        Here is a sample of the resulting data (first 10 rows):
        {data_sample}
        
        Total rows returned: {total_rows}
        
        Provide a concise, highly actionable business insight based on this data. 
        If no rows were returned, explain clearly and naturally that there is no data matching the user's criteria (e.g., "Không có yếu tố nào khác thỏa mãn điều kiện này", "There are no users matching this condition").
        Focus on game analytics metrics like retention, monetization, and user experience.
        Limit the insight to 3-4 sentences.
        
        Also, provide an array of 3 suggested follow-up questions the user could ask next to dig deeper into this specific data or related metrics.
        
        {lang_instruction}
        
        IMPORTANT: Return the response ONLY as a valid JSON object with EXACTLY these keys:
        - "insight": a string
        - "suggested_questions": an array of 3 strings
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                print("Gemini limit exceeded. Falling back to OpenAI...")
                text = _openai_fallback(prompt).strip()
            else:
                raise e
        
        import json, re
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
            
        try:
            return json.loads(text)
        except Exception as e:
            return {
                "insight": text,
                "suggested_questions": []
            }
