import { PrismaClient, Discipline, Position } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { disciplineLabel, positionLabel } from "../src/lib/constants";

// Soal dummy: prisma/data/questions/<DISIPLIN>.<JENJANG>.json, 30 soal per file.
// Format: [{ "text": "...", "options": ["A","B","C","D"], "correct": "A" }]

const DISCIPLINES: Discipline[] = ["INSTRUMENTASI", "ELECTRICAL", "STATIONARY", "ROTATING", "CIVIL"];
const POSITIONS: Position[] = ["JR_TECHNICIAN_I", "JR_TECHNICIAN_II", "TECHNICIAN_I", "TECHNICIAN_II", "SR_TECHNICIAN_I"];

type Item = { text: string; options: [string, string, string, string]; correct: string };

function load(discipline: Discipline, position: Position): Item[] {
  const file = path.join(__dirname, "data", "questions", `${discipline}.${position}.json`);
  const items = JSON.parse(readFileSync(file, "utf8")) as Item[];
  items.forEach((q, i) => {
    if (!q.text || q.options?.length !== 4 || !"ABCD".includes(q.correct) || q.correct.length !== 1) {
      throw new Error(`${path.basename(file)} soal #${i + 1} tidak valid`);
    }
  });
  return items;
}

export function bankName(discipline: Discipline, position: Position) {
  return `${disciplineLabel(discipline)} - ${positionLabel(position)} (dummy)`;
}

/** Buat bank soal dummy untuk semua kombinasi disiplin x jenjang. Bank yang sudah ada dilewati. */
export async function seedQuestionBanks(prisma: PrismaClient) {
  let created = 0;
  let skipped = 0;
  for (const discipline of DISCIPLINES) {
    for (const position of POSITIONS) {
      const name = bankName(discipline, position);
      if (await prisma.questionBank.findFirst({ where: { name } })) {
        skipped++;
        continue;
      }
      const items = load(discipline, position);
      await prisma.questionBank.create({
        data: {
          name,
          discipline,
          position,
          questions: {
            create: items.map((q) => ({
              text: q.text,
              optionA: q.options[0],
              optionB: q.options[1],
              optionC: q.options[2],
              optionD: q.options[3],
              correctOption: q.correct,
              points: 1,
            })),
          },
        },
      });
      created++;
    }
  }
  return { created, skipped };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedQuestionBanks(prisma)
    .then((r) => console.log(`Bank soal dummy: ${r.created} dibuat, ${r.skipped} dilewati (sudah ada).`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
