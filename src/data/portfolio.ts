import game1 from "@/assets/projects/game-1.png.asset.json";
import game2 from "@/assets/projects/game-2.png.asset.json";
import game3 from "@/assets/projects/game-3.png.asset.json";
import game4 from "@/assets/projects/game-4.png.asset.json";
import game5 from "@/assets/projects/game-5.png.asset.json";
import game6 from "@/assets/projects/game-6.png.asset.json";
import game7 from "@/assets/projects/game-7.png.asset.json";
import game8 from "@/assets/projects/game-8.png.asset.json";
import game9 from "@/assets/projects/game-9.png.asset.json";
import caleb from "@/assets/team/caleb.png.asset.json";
import marisa from "@/assets/team/marisa.png.asset.json";
import blast from "@/assets/team/blast.png.asset.json";
import shark from "@/assets/team/shark.png.asset.json";
import alpha from "@/assets/team/alpha.png.asset.json";

export interface PortfolioProject {
  id: string;
  title: string;
  studio: string;
  tags: string[];
  description: string;
  url: string;
  image: string;
}

export const PORTFOLIO_STORAGE_KEY = "deadly_studio_portfolio";

export const defaultProjects: PortfolioProject[] = [
  { id: "killstreak", title: "(SEASON 2) KILLSTREAK", studio: "Legionary Studio", tags: ["FPS", "Movement", "Gunplay"], description: "A high-velocity arena FPS engineered around movement mastery and decisive gunplay.", url: "https://www.roblox.com/games/90184287580174/KILLSTREAK", image: game1.url },
  { id: "ballistic-edge", title: "Ballistic Edge", studio: "x_up studios", tags: ["PVP", "Round-Based", "Cosmetics"], description: "Competitive round-based action with readable systems and a sharp cosmetic identity.", url: "https://www.roblox.com/games/122111057721305/Ballistic-Edge", image: game2.url },
  { id: "showdown", title: "Showdown: Anime FPS ⚔ Jutsu Shooter", studio: "ShowDown FPS", tags: ["Anime", "Duels", "Jutsu"], description: "Anime duels translated into a fast, expressive first-person combat experience.", url: "https://www.roblox.com/games/125538696653169/Showdown-Anime-FPS-Jutsu-Shooter", image: game3.url },
  { id: "httyd", title: "HOW TO TRAIN YOUR DRAGON", studio: "Official Movie", tags: ["RPG", "Quests", "Open World"], description: "An expansive licensed world built around discovery, quests, and dragon-led adventure.", url: "https://www.roblox.com/games/75663528075786/HOW-TO-TRAIN-YOUR-DRAGON", image: game4.url },
  { id: "arise", title: "ARISE 1.0", studio: "CL GAMES!", tags: ["Solo Leveling", "Dungeons", "Summoning"], description: "A progression RPG where dungeon runs unlock an ever-growing summoned army.", url: "https://www.roblox.com/games/87039211657390/ARISE-1-0", image: game5.url },
  { id: "ragnarok", title: "Arise Ragnarok", studio: "CLGAMES", tags: ["Hunters", "Trading", "PvE Quests"], description: "A social hunter RPG balancing deep trading, progression, and cooperative PvE.", url: "https://www.roblox.com/games/137700422270232/Arise-Ragnarok", image: game6.url },
  { id: "pet-horizon", title: "[NEW] Pet Horizon Reborn", studio: "Modernization Games", tags: ["Pets", "Trading", "Progression"], description: "A collectible world designed for satisfying progression and player-led trading.", url: "https://www.roblox.com/games/105723408256428/Pet-Horizon-Reborn", image: game7.url },
  { id: "wanted", title: "Wanted", studio: "DevvGames", tags: ["Missions", "Vehicles", "Oasis City"], description: "A mission-driven urban sandbox where vehicles and player choice shape every run.", url: "https://www.roblox.com/games/14438406081/Wanted", image: game8.url },
  { id: "sink-a-donut", title: "Sink a Donut 🍩", studio: "Visual Grounds Studio", tags: ["Arcade", "Tactical", "Strategy"], description: "A compact tactical arcade concept with playful stakes and strategic depth.", url: "https://www.roblox.com/games/123004300890940/Sink-a-Donut", image: game9.url },
];

export const team = [
  { name: "Caleb", role: "CEO & CMO", description: "Runs the core pipeline and leads studio development strategy.", image: caleb.url },
  { name: "Oscar", role: "Lead Producer", description: "Directs cross-functional team roadmaps and execution workflows.", image: null },
  { name: "Marisa", role: "Thumbnail Lead", description: "Architects high-conversion visual marketing assets and identity guidelines.", image: marisa.url },
  { name: "Blast", role: "Game Dev Team (In-House)", description: "In-house SFX Artist", image: blast.url },
  { name: "Shark", role: "Game Dev Team (In-House)", description: "Optimizes simulation frameworks, performance metrics, and client experiences.", image: shark.url },
  { name: "Alpha", role: "Game Dev Team (In-House)", description: "Implements structural layout patterns, UI workflows, and system data pipelines.", image: alpha.url },
];

export function readProjects(): PortfolioProject[] {
  const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (!stored) return defaultProjects;
  try {
    const projects = JSON.parse(stored) as PortfolioProject[];
    return Array.isArray(projects) ? projects : defaultProjects;
  } catch {
    return defaultProjects;
  }
}