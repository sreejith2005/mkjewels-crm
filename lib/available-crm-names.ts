export function availableCrmNames(
  allocation: { crm_name: string }[],
  availability: { crm_name: string; is_available: boolean }[],
) {
  const unavailable = new Set(
    availability.filter((item) => !item.is_available).map((item) => item.crm_name),
  );
  return allocation.filter((item) => !unavailable.has(item.crm_name)).map((item) => item.crm_name);
}
