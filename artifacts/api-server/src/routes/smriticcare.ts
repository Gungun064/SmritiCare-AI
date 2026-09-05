import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import {
  caregiverConnectionsTable,
  db,
  gameResultsTable,
  insertGameResultSchema,
  insertMemorySchema,
  insertRoutineSchema,
  insertStorySchema,
  memoriesTable,
  profileRoleSchema,
  routinesTable,
  storiesTable,
  userProfilesTable,
} from "@workspace/db";
import { getRequestUserId, requireAuth } from "../middlewares/requireAuth";
import { getCurrentDateIST } from "../lib/time";

const router: IRouter = Router();
router.use(requireAuth);

function connectionCode(): string {
  return `SMR-${Math.floor(100000 + Math.random() * 900000)}`;
}

function currentUserId(req: Parameters<typeof getRequestUserId>[0]): string {
  return getRequestUserId(req) as string;
}

async function requireProfileRole(
  req: Parameters<typeof getRequestUserId>[0],
  res: Response,
  role: "elder" | "caregiver",
): Promise<boolean> {
  const [profile] = await db
    .select({ role: userProfilesTable.role })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, currentUserId(req)));
  if (profile?.role !== role) {
    res.status(403).json({ error: `${role} access required` });
    return false;
  }
  return true;
}

router.get("/me", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));
  if (!profile) {
    res.json({ profile: null, results: [], memories: [], stories: [], routines: [] });
    return;
  }

  const [results, memories, stories, routines] = await Promise.all([
    db
      .select()
      .from(gameResultsTable)
      .where(eq(gameResultsTable.userId, userId))
      .orderBy(desc(gameResultsTable.createdAt)),
    db.select().from(memoriesTable).where(eq(memoriesTable.userId, userId)),
    db.select().from(storiesTable).where(eq(storiesTable.userId, userId)),
    db
      .select()
      .from(routinesTable)
      .where(
        and(
          eq(routinesTable.userId, userId),
          eq(routinesTable.dateKey, getCurrentDateIST()),
        ),
      )
      .orderBy(routinesTable.time),
  ]);
  res.json({ profile, results, memories, stories, routines });
});

router.post("/me/profile", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  const role = profileRoleSchema.safeParse(req.body?.role);
  const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const language = req.body?.preferredLanguage === "Hindi" ? "Hindi" : "English";
  if (!role.success || !fullName || !email) {
    res.status(400).json({ error: "Full name, email, and role are required." });
    return;
  }

  const [profile] = await db
    .insert(userProfilesTable)
    .values({
      userId,
      role: role.data,
      fullName,
      email,
      preferredLanguage: language,
      caregiverName: typeof req.body?.caregiverName === "string" ? req.body.caregiverName.trim() : null,
      relationship: typeof req.body?.relationship === "string" ? req.body.relationship.trim() : null,
      connectionCode: connectionCode(),
    })
    .onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        role: role.data,
        fullName,
        email,
        preferredLanguage: language,
        caregiverName: typeof req.body?.caregiverName === "string" ? req.body.caregiverName.trim() : null,
        relationship: typeof req.body?.relationship === "string" ? req.body.relationship.trim() : null,
        updatedAt: new Date(),
      },
    })
    .returning();
  res.status(201).json(profile);
});

router.patch("/me/profile", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  const changes: Record<string, unknown> = { updatedAt: new Date() };
  if (req.body?.preferredLanguage === "Hindi" || req.body?.preferredLanguage === "English") {
    changes.preferredLanguage = req.body.preferredLanguage;
  }
  if (typeof req.body?.shareMemory === "boolean") changes.shareMemory = req.body.shareMemory;
  if (Object.keys(changes).length === 1) {
    res.status(400).json({ error: "No profile changes supplied." });
    return;
  }
  const [profile] = await db
    .update(userProfilesTable)
    .set(changes)
    .where(eq(userProfilesTable.userId, userId))
    .returning();
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
});

router.post("/me/results", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  const parsed = insertGameResultSchema.safeParse({
    ...req.body,
    userId,
    localDateIst: getCurrentDateIST(),
    syncStatus: "synced",
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [result] = await db
    .insert(gameResultsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(result);
});

router.post("/me/memories", async (req, res): Promise<void> => {
  const parsed = insertMemorySchema.safeParse({ ...req.body, userId: currentUserId(req) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [memory] = await db.insert(memoriesTable).values(parsed.data).returning();
  res.status(201).json(memory);
});

router.delete("/me/memories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid memory id" });
    return;
  }
  const [deleted] = await db
    .delete(memoriesTable)
    .where(and(eq(memoriesTable.id, id), eq(memoriesTable.userId, currentUserId(req))))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/me/stories", async (req, res): Promise<void> => {
  const parsed = insertStorySchema.safeParse({ ...req.body, userId: currentUserId(req) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [story] = await db.insert(storiesTable).values(parsed.data).returning();
  res.status(201).json(story);
});

router.post("/me/routines", async (req, res): Promise<void> => {
  const parsed = insertRoutineSchema.safeParse({
    ...req.body,
    userId: currentUserId(req),
    dateKey: getCurrentDateIST(),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [routine] = await db.insert(routinesTable).values(parsed.data).returning();
  res.status(201).json(routine);
});

router.patch("/me/routines/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || typeof req.body?.completed !== "boolean") {
    res.status(400).json({ error: "Valid routine id and completion state are required." });
    return;
  }
  const [routine] = await db
    .update(routinesTable)
    .set({ completed: req.body.completed, updatedAt: new Date() })
    .where(and(eq(routinesTable.id, id), eq(routinesTable.userId, currentUserId(req))))
    .returning();
  if (!routine) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }
  res.json(routine);
});

router.delete("/me/routines/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid routine id" });
    return;
  }
  const [deleted] = await db
    .delete(routinesTable)
    .where(and(eq(routinesTable.id, id), eq(routinesTable.userId, currentUserId(req))))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/caregiver/connections", async (req, res): Promise<void> => {
  if (!(await requireProfileRole(req, res, "caregiver"))) return;
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  if (!code) {
    res.status(400).json({ error: "Connection code is required." });
    return;
  }
  const [elder] = await db
    .select()
    .from(userProfilesTable)
    .where(and(eq(userProfilesTable.connectionCode, code), eq(userProfilesTable.role, "elder")));
  if (!elder) {
    res.status(404).json({ error: "We could not find an elderly profile with that code." });
    return;
  }
  const caregiverUserId = currentUserId(req);
  await db
    .insert(caregiverConnectionsTable)
    .values({ caregiverUserId, elderUserId: elder.userId })
    .onConflictDoNothing();
  res.status(201).json({ connected: true, elder: { userId: elder.userId, fullName: elder.fullName } });
});

router.get("/caregiver/overview", async (req, res): Promise<void> => {
  if (!(await requireProfileRole(req, res, "caregiver"))) return;
  const connections = await db
    .select()
    .from(caregiverConnectionsTable)
    .where(eq(caregiverConnectionsTable.caregiverUserId, currentUserId(req)));
  const connection = connections[0];
  if (!connection) {
    res.json({ connected: false, isDemo: true, profile: null, results: [], routines: [], memories: [] });
    return;
  }
  const [profile, results, routines] = await Promise.all([
    db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, connection.elderUserId)),
    db
      .select()
      .from(gameResultsTable)
      .where(eq(gameResultsTable.userId, connection.elderUserId))
      .orderBy(desc(gameResultsTable.createdAt)),
    db
      .select()
      .from(routinesTable)
      .where(
        and(
          eq(routinesTable.userId, connection.elderUserId),
          eq(routinesTable.dateKey, getCurrentDateIST()),
        ),
      ),
  ]);
  const memories =
    profile[0]?.shareMemory
      ? await db
          .select()
          .from(memoriesTable)
          .where(eq(memoriesTable.userId, connection.elderUserId))
      : [];
  res.json({ connected: true, isDemo: false, profile: profile[0] ?? null, results, routines, memories });
});

export default router;