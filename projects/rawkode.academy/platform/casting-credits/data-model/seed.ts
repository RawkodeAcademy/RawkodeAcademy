import { db } from "./client";
import { seedDatabase } from "./database-utils";

const seed = async () => {
	await seedDatabase(db);
	process.exit(0);
};

await seed();
