import streamlit as st
import os
import pandas as pd
from agents import SQLAgent, VizAgent, InsightAgent
from dotenv import load_dotenv

# Load env variables and optional Supabase logic
load_dotenv()

# Setup Supabase (Optional)
try:
    from supabase import create_client, Client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if supabase_url and supabase_key and supabase_url != "YOUR_SUPABASE_URL":
        supabase: Client = create_client(supabase_url, supabase_key)
    else:
        supabase = None
except ImportError:
    supabase = None

# Streamlit Page Config
st.set_page_config(page_title="Agentic Game Analytics", page_icon="🎮", layout="wide")

# Custom Cyberpunk CSS
st.markdown("""
<style>
    /* Dark Theme & Grid Background */
    .stApp {
        background-color: #0B0F19;
        background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
        color: #E0E6ED;
        font-family: 'Inter', sans-serif;
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #00F0FF;
        text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
    }
    
    /* Neon Glow Effects for Containers */
    .stChatInputContainer {
        border-radius: 10px;
        border: 1px solid #FF0055;
        box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
    }
    
    /* Glassmorphism Containers */
    div[data-testid="stChatMessage"] {
        background: rgba(20, 25, 40, 0.6);
        backdrop-filter: blur(10px);
        border-radius: 10px;
        border: 1px solid rgba(0, 240, 255, 0.2);
        padding: 15px;
        margin-bottom: 10px;
    }
    
    /* Code blocks (SQL) */
    code {
        color: #FF0055 !important;
        background: rgba(255, 0, 85, 0.1) !important;
    }
</style>
""", unsafe_allow_html=True)

st.title("🎮 Agentic Game Data Analytics Platform")
st.markdown("Ask natural language questions about your game's players, monetization, and surveys.")

# Initialize Agents
@st.cache_resource
def get_agents():
    return SQLAgent(), VizAgent(), InsightAgent()

sql_agent, viz_agent, insight_agent = get_agents()

# Chat History state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "sql" in msg:
            with st.expander("Show Generated SQL"):
                st.code(msg["sql"], language="sql")
        if "df" in msg:
            st.dataframe(msg["df"], use_container_width=True)
        if "chart" in msg and msg["chart"] is not None:
            st.plotly_chart(msg["chart"], use_container_width=True)
        if "insight" in msg:
            st.info(f"💡 **AI Insight:** {msg['insight']}")

# User Input
prompt = st.chat_input("E.g., Show me the revenue by VIP tier")

if prompt:
    # 1. Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
        
    # Optional: Log to Supabase
    if supabase:
        try:
            supabase.table("queries").insert({"prompt": prompt}).execute()
        except Exception as e:
            pass # Ignore logging errors
            
    # 2. Process with Agents
    with st.chat_message("assistant"):
        with st.spinner("Translating to SQL..."):
            try:
                # Step 1: SQL Generation
                sql_query = sql_agent.generate_sql(prompt)
                
                # Step 2: Data Retrieval
                df = sql_agent.execute_sql(sql_query)
                
                # Step 3: Visualization
                chart = viz_agent.generate_chart(df, prompt)
                
                # Step 4: Insight Generation
                insight = insight_agent.generate_insight(prompt, df)
                
                # Display Results
                st.markdown(f"**Results for:** {prompt}")
                with st.expander("Show Generated SQL"):
                    st.code(sql_query, language="sql")
                
                if df.empty:
                    st.warning("Query returned no results.")
                else:
                    st.dataframe(df, use_container_width=True)
                    if chart:
                        st.plotly_chart(chart, use_container_width=True)
                    st.info(f"💡 **AI Insight:** {insight}")
                    
                # Save to history
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": "Here is what I found:",
                    "sql": sql_query,
                    "df": df,
                    "chart": chart,
                    "insight": insight
                })
                
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                st.session_state.messages.append({"role": "assistant", "content": f"Error: {str(e)}"})
