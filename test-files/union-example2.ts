export type Role = "admin" | "user" | "guest";

export function hasPermission(role: "admin" | "user" | "guest"): boolean {
  return role === "admin";
}

export const userRoles: Array<"admin" | "user" | "guest"> = ["admin", "user"];

export function processStatus(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return true;
  }
  return false;
}
