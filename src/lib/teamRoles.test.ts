import { describe, expect, it } from "vitest";
import { canAssignRole, canManageTeam, teamRole } from "./teamRoles";

describe("Outrun team roles", () => {
  for (const role of ["owner", "admin", "management", "designer", "customer_support"] as const) {
    it(`recognizes ${role} as a team role`, () => expect(teamRole(["user", role])).toBe(role));
  }
  it("keeps customers out of the workspace", () => expect(teamRole(["user"])).toBeNull());
  it("allows the owner to assign admins", () => expect(canAssignRole("owner", null, "admin")).toBe(true));
  it("protects the owner from removal", () => expect(canAssignRole("owner", "owner", "user")).toBe(false));
  it("prevents admins from appointing admins", () => expect(canAssignRole("admin", null, "admin")).toBe(false));
  it("prevents admins from removing admins", () => expect(canAssignRole("admin", "admin", "user")).toBe(false));
  it("allows admins to assign designers", () => expect(canAssignRole("admin", null, "designer")).toBe(true));
  it("keeps team administration unavailable to management", () => expect(canManageTeam("management")).toBe(false));
  it("rejects unknown roles", () => expect(canAssignRole("owner", null, "superuser")).toBe(false));
});