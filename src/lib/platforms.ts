// Platform adapter registry. Add a new platform by adding an entry here
// (plus a server-side metrics adapter) — no dashboard changes needed.
export type PlatformId = "roblox" | "uefn";

export interface PlatformAdapter {
  id: PlatformId;
  label: string;
  available: boolean;
  idLabel: string;
  parseExternalId: (input: string) => string | null;
  gameUrl: (externalId: string) => string;
}

export const PLATFORMS: Record<PlatformId, PlatformAdapter> = {
  roblox: {
    id: "roblox",
    label: "Roblox",
    available: true,
    idLabel: "Game URL or place ID",
    parseExternalId: (v) => {
      const m = v.trim().match(/(?:games\/)?(\d{3,20})/);
      return m ? m[1] : null;
    },
    gameUrl: (id) => `https://www.roblox.com/games/${id}`,
  },
  uefn: {
    id: "uefn",
    label: "UEFN",
    available: false,
    idLabel: "Island code (e.g. 1234-5678-9012)",
    parseExternalId: (v) => (/^\d{4}-\d{4}-\d{4}$/.test(v.trim()) ? v.trim() : null),
    gameUrl: (id) => `https://www.fortnite.com/@creator/${id}`,
  },
};

export const GENRES = ["fps", "simulator", "rpg", "horror", "adventure", "tycoon", "obby", "pvp", "other"] as const;
export const LISTING_CATEGORIES = [
  ["games", "Games"], ["assets", "Assets"], ["ui", "UI"], ["vfx", "VFX"], ["sfx", "SFX"],
  ["scripts", "Scripts"], ["plugins", "Plugins"], ["dev-services", "Development Services"], ["creative-services", "Creative Services"],
] as const;
export const COMPAT_LABEL = { roblox: "Roblox", uefn: "UEFN", multi: "Multi-platform" } as const;
