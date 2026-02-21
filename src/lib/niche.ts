import type { NicheConfig } from "./types";
import ngoConfig from "../../niches/ngo/config.json";
import climateConfig from "../../niches/climate/config.json";

const niches: Record<string, NicheConfig> = {
  ngo: ngoConfig as NicheConfig,
  climate: climateConfig as NicheConfig,
};

export function getNiche(): NicheConfig {
  const nicheId = process.env.NICHE_ID || "ngo";
  const niche = niches[nicheId];
  if (!niche) {
    throw new Error(`Unknown niche: ${nicheId}. Available: ${Object.keys(niches).join(", ")}`);
  }
  return niche;
}

export function getAllNiches(): NicheConfig[] {
  return Object.values(niches);
}
