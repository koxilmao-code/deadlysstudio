export const TEAM_ROLES = ["owner", "admin", "management", "designer", "customer_support"] as const;
export type TeamRole = typeof TEAM_ROLES[number];
export const ROLE_LABELS: Record<TeamRole | "user", string> = {
  owner: "Owner", admin: "Admin", management: "Management", designer: "Designer", customer_support: "Customer support", user: "Customer",
};
export function teamRole(roles: readonly string[]): TeamRole | null {
  return TEAM_ROLES.find((role) => roles.includes(role)) ?? (roles.includes("staff") ? "management" : null);
}
export const canManageTeam = (role: TeamRole | null) => role === "owner" || role === "admin";
export const canManagePortfolio = (role: TeamRole | null) => canManageTeam(role) || role === "management";
export function canAssignRole(caller: TeamRole | null, current: TeamRole | null, next: string) {
  if (!canManageTeam(caller) || current === "owner" || !["admin", "management", "designer", "customer_support", "user"].includes(next)) return false;
  return caller === "owner" || (current !== "admin" && next !== "admin");
}