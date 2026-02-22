/**
 * Convert CO2 emissions (kg) to real-world equivalents
 * for better understanding of environmental impact
 */

interface CarbonEquivalent {
  text: string;
  value: number;
  unit: string;
}

// Conversion factors (approximate)
const FLIGHT_PARIS_NY_CO2 = 1.2; // kg CO2 per passenger (one way)
const CAR_CO2_PER_KM = 0.2; // kg CO2 per km (average car)
const TREE_CO2_PER_YEAR = 20; // kg CO2 absorbed per tree per year
const PHONE_CHARGE_CO2 = 0.05; // kg CO2 per phone charge (100 charges = 5kg)
const BURGER_CO2 = 2.5; // kg CO2 per burger

/**
 * Get the most relevant carbon equivalent for a given CO2 amount
 */
export function getCarbonEquivalent(co2Kg: number): CarbonEquivalent {
  // For very small amounts (< 0.1 kg)
  if (co2Kg < 0.1) {
    const charges = Math.round(co2Kg / PHONE_CHARGE_CO2);
    return {
      text: `equivalent to ${charges} phone charge${charges > 1 ? 's' : ''}`,
      value: charges,
      unit: 'charges',
    };
  }

  // For small amounts (0.1 - 1.2 kg) - use car km
  if (co2Kg < FLIGHT_PARIS_NY_CO2) {
    const km = Math.round(co2Kg / CAR_CO2_PER_KM);
    return {
      text: `equivalent to ${km} km by car`,
      value: km,
      unit: 'km',
    };
  }

  // For medium amounts (1.2 - 20 kg) - use flights
  if (co2Kg < TREE_CO2_PER_YEAR) {
    const flights = Math.round(co2Kg / FLIGHT_PARIS_NY_CO2);
    return {
      text: `equivalent to ${flights} Paris-New York flight${flights > 1 ? 's' : ''}`,
      value: flights,
      unit: 'flights',
    };
  }

  // For larger amounts (20 - 50 kg) - use burgers
  if (co2Kg < 50) {
    const burgers = Math.round(co2Kg / BURGER_CO2);
    return {
      text: `equivalent to ${burgers} burger${burgers > 1 ? 's' : ''}`,
      value: burgers,
      unit: 'burgers',
    };
  }

  // For very large amounts (50+ kg) - use trees
  const trees = Math.round(co2Kg / TREE_CO2_PER_YEAR);
  return {
    text: `equivalent to ${trees} tree${trees > 1 ? 's' : ''} planted for 1 year`,
    value: trees,
    unit: 'trees',
  };
}

/**
 * Get multiple equivalents for display (top 2-3 most relevant)
 */
export function getCarbonEquivalents(co2Kg: number): CarbonEquivalent[] {
  const equivalents: CarbonEquivalent[] = [];

  // Always include the primary equivalent
  equivalents.push(getCarbonEquivalent(co2Kg));

  // Add secondary equivalent if significantly different
  if (co2Kg >= FLIGHT_PARIS_NY_CO2 && co2Kg < TREE_CO2_PER_YEAR) {
    const km = Math.round(co2Kg / CAR_CO2_PER_KM);
    equivalents.push({
      text: `or ${km} km by car`,
      value: km,
      unit: 'km',
    });
  } else if (co2Kg >= TREE_CO2_PER_YEAR) {
    const flights = Math.round(co2Kg / FLIGHT_PARIS_NY_CO2);
    equivalents.push({
      text: `or ${flights} Paris-New York flight${flights > 1 ? 's' : ''}`,
      value: flights,
      unit: 'flights',
    });
  }

  return equivalents;
}
