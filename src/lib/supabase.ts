// Supabase configuration for Edge Functions
const SUPABASE_URL = "https://zomtudzqlwyewfhczrkp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbXR1ZHpxbHd5ZXdmaGN6cmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwNjUsImV4cCI6MjA4NzI0NjA2NX0.gcfdS7JCZBsV0DvNTTTACP7KXu0MhCVdg36TZOECNFY";

export const callEdgeFunction = async (
  functionName: string,
  body?: any,
  options?: { method?: string }
): Promise<any> => {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const method = options?.method || "POST";
  
  const headers: HeadersInit = {
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };

  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export { SUPABASE_URL, SUPABASE_ANON_KEY };
