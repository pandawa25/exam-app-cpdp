export const DISCIPLINES = [
  { value: "INSTRUMENTASI", label: "Instrumentasi" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "STATIONARY", label: "Stationary Equipment" },
  { value: "ROTATING", label: "Rotating Equipment" },
] as const;

export const POSITIONS = [
  { value: "TEKNISI_JUNIOR", label: "Teknisi Junior" },
  { value: "TEKNISI_SENIOR", label: "Teknisi Senior" },
  { value: "SUPERVISOR_LAPANGAN", label: "Supervisor Lapangan" },
  { value: "ENGINEER", label: "Engineer" },
] as const;

export function disciplineLabel(value: string) {
  return DISCIPLINES.find((d) => d.value === value)?.label ?? value;
}

export function positionLabel(value: string) {
  return POSITIONS.find((p) => p.value === value)?.label ?? value;
}
