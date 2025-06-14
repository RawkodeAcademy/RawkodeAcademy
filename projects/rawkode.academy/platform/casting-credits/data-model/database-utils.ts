import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { castingCreditsTable } from "./schema";

/**
 * Shared migration utility that can work with different database types
 */
export function getMigrationsFolder() {
  return `${dirname(fileURLToPath(import.meta.url))}/migrations`;
}

/**
 * Shared seeding utility with flexible data options
 */
export async function seedDatabase(
  db: any,
  customData?: Array<{ personId: string; role: string; videoId: string }>
) {
  const defaultData = [
    { personId: "rawkode", role: "Host", videoId: "abc123" },
  ];
  
  const dataToInsert = customData || defaultData;
  return await db
    .insert(castingCreditsTable)
    .values(dataToInsert)
    .returning()
    .all();
}