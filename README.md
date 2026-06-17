# Agentic Game Data Analytics Platform

A fully functional, LLM-powered data analytics dashboard for game data. Users can query data using natural language, and the system automatically generates DuckDB SQL, executes it against local CSVs, plots the results, and generates actionable AI insights.

## Features
- **Chat Interface**: Streamlit-based chat UI with a custom Cyberpunk theme.
- **SQL Generation**: Uses Gemini 1.5 Flash to convert English to DuckDB SQL.
- **In-Memory Analytics**: Fast SQL execution over CSVs using DuckDB and Pandas.
- **Auto-Visualization**: Automatically plots bar, line, or scatter charts using Plotly Express based on the returned data.
- **AI Insights**: Automatically summarizes the query results with business insights.

## Getting Started Locally

1. **Clone & Install Dependencies**
   Ensure you have Python 3.9+ installed.
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key to `.env`:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
   ```

3. **Generate Mock Data**
   Run the data generation script to create `users_segment.csv`, `payments.csv`, and `surveys.csv`.
   ```bash
   python data_generator.py
   ```

4. **Run the App**
   ```bash
   streamlit run app.py
   ```

## Deployment to Streamlit Community Cloud

1. Push this repository to GitHub (ensure `.env` is ignored by `.gitignore`).
2. Go to [Streamlit Community Cloud](https://share.streamlit.io/) and create a new app from your repository.
3. In the Streamlit app settings (Advanced Settings > Secrets), add your API key via `secrets.toml` format:
   ```toml
   GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
   ```

## Optional: Supabase Prompt Logging

If you want to log user prompts to a Supabase PostgreSQL database:
1. Create a project in Supabase.
2. Create a table named `queries` with a text column `prompt`.
3. Add `SUPABASE_URL` and `SUPABASE_KEY` to your `.env` (or Streamlit Secrets).
4. The app will automatically connect and insert prompts when users ask questions.
