export const DISCIPLINES = [
  { value: "INSTRUMENTASI", label: "Instrumentasi" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "STATIONARY", label: "Stationary Equipment" },
  { value: "ROTATING", label: "Rotating Equipment" },
  { value: "CIVIL", label: "Civil" },
] as const;

// Nama disiplin yang dipakai di nama jabatan lengkap, mis. "Jr. Technician I Instrument".
const TITLE_NAMES: Record<string, string> = {
  INSTRUMENTASI: "Instrument",
  ELECTRICAL: "Electrical",
  STATIONARY: "Stationary",
  ROTATING: "Rotating Equipment",
  CIVIL: "Civil",
};

export const POSITIONS = [
  { value: "JR_TECHNICIAN_I", label: "Jr. Technician I" },
  { value: "JR_TECHNICIAN_II", label: "Jr. Technician II" },
  { value: "TECHNICIAN_I", label: "Technician I" },
  { value: "TECHNICIAN_II", label: "Technician II" },
  { value: "SR_TECHNICIAN_I", label: "Sr. Technician I" },
] as const;

export const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "PESERTA", label: "Peserta" },
] as const;

export const MIN_PASSWORD_LENGTH = 8;

export function roleLabel(value: string) {
  return ROLES.find((r) => r.value === value)?.label ?? value;
}

export function disciplineLabel(value: string) {
  return DISCIPLINES.find((d) => d.value === value)?.label ?? value;
}

export function positionLabel(value: string) {
  return POSITIONS.find((p) => p.value === value)?.label ?? value;
}

/** Jabatan lengkap = jenjang + disiplin, mis. "Jr. Technician I Instrument". */
export function jobTitle(discipline: string | null | undefined, position: string | null | undefined) {
  if (!position) return "-";
  const level = positionLabel(position);
  return discipline ? `${level} ${TITLE_NAMES[discipline] ?? disciplineLabel(discipline)}` : level;
}
