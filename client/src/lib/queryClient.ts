import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || res.statusText;
    } catch {
      // If JSON parsing fails, try text
      try {
        errorMessage = await res.text() || res.statusText;
      } catch {
        errorMessage = res.statusText;
      }
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // No stale time - always fresh for auth
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403/404 errors
        if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('404')) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx)
        if (error?.message?.match(/^4\d\d:/)) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});
