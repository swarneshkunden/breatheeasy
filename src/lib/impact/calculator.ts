import { EMISSION_CONSTANTS } from "./constants";

export function tripImpact(distanceKm: number) {
  const distance = Math.max(0, distanceKm);
  const carCo2 = distance * EMISSION_CONSTANTS.petrolCarGCo2PerKm;
  const metroCo2 = distance * EMISSION_CONSTANTS.metroGCo2PerKm;
  const carNoX = distance * EMISSION_CONSTANTS.petrolCarGNoXPerKm;
  const metroNoX = distance * EMISSION_CONSTANTS.metroGNoXPerKm;
  return {
    co2AvoidedG: Math.round(carCo2 - metroCo2),
    noxAvoidedG: Math.round((carNoX - metroNoX) * 100) / 100,
  };
}

export function purifierImpact(roomSizeM2: number, cadr: number) {
  const room = Math.max(1, roomSizeM2);
  const reduction = Math.min(80, Math.max(15, (cadr / (room * 2.5)) * 100));
  return Math.round(reduction);
}

export function exposureCigarettes(pm25: number | null): number | null {
  if (pm25 === null) return null;
  return (
    Math.round((pm25 / EMISSION_CONSTANTS.cigaretteEquivalentPm25Per24h) * 10) /
    10
  );
}
