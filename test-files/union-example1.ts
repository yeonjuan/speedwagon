export type Status = "pending" | "approved" | "rejected";

export function updateStatus(status: "pending" | "approved" | "rejected") {
  console.log(status);
}

export function checkStatus(
  status: "pending" | "approved" | "rejected",
): boolean {
  return status === "approved";
}
