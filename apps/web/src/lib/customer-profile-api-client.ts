export async function fetchCustomerProfileViaApi(): Promise<
  | { success: true; firstName: string; lastName: string; email: string; phone: string }
  | { success: false; error: string }
> {
  const response = await fetch("/api/customer/profile", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  let result: {
    success?: boolean;
    error?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } = {};

  try {
    result = await response.json();
  } catch {
    return {
      success: false,
      error: response.ok
        ? "Could not read profile response."
        : `Could not load profile (${response.status}).`,
    };
  }

  if (!response.ok || result.success === false) {
    return {
      success: false,
      error: result.error || `Could not load profile (${response.status}).`,
    };
  }

  return {
    success: true,
    firstName: result.firstName || "",
    lastName: result.lastName || "",
    email: result.email || "",
    phone: result.phone || "",
  };
}

export async function patchCustomerProfileViaApi(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const response = await fetch("/api/customer/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  let result: { success?: boolean; error?: string } = {};
  try {
    result = await response.json();
  } catch {
    return {
      success: false,
      error: response.ok
        ? "Save failed: invalid server response."
        : `Save failed (${response.status}). Refresh and try again.`,
    };
  }

  if (!response.ok || result.success === false) {
    return {
      success: false,
      error: result.error || `Save failed (${response.status}).`,
    };
  }

  return { success: true };
}
