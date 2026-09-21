export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${res.status}`,
        details: data.details,
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error. Please ensure the backend server is running.",
    };
  }
}
