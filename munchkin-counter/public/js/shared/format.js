/** Gear shown with a sign: +3, 0, -2. */
export const formatGear = (gear) => (gear > 0 ? `+${gear}` : String(gear));

export const plural = (count, one, many = `${one}s`) => (count === 1 ? one : many);
