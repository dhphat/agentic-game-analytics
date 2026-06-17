import { NextResponse } from 'next/server';
import { API_URL } from '@/utils/config';

export async function POST(req: Request) {
  try {
    const { message, language = "en" } = await req.json();

    let targetUrl = `${API_URL}/api/chat`;
    let fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language })
    };

    if (message.trim().toLowerCase() === '/predict churn') {
      targetUrl = `${API_URL}/api/predict-churn`;
      fetchOptions = { method: 'GET' };
    }

    // Forward the request to the Python FastAPI backend
    const backendResponse = await fetch(targetUrl, fetchOptions);
    
    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`);
    }

    const data = await backendResponse.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
