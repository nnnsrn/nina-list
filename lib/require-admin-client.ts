export async function assertAdminClient(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch("/api/admin/check", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await response.json();
    return data.loggedIn === true;
  } catch {
    return false;
  }
}
