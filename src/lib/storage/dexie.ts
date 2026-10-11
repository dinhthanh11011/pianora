import Dexie, { type Table } from "dexie";
import { emptySnapshot } from "@/lib/gamification/events";
import type { Attempt, BadgeAward, Card, ChangeSet, Day, LessonProgress, Profile, ProgressRepository, ProgressSnapshot } from "./types";

class PianoraDb extends Dexie {
  profile!: Table<Profile, string>;
  lessonProgress!: Table<LessonProgress, string>;
  attempts!: Table<Attempt, string>;
  days!: Table<Day, string>;
  srsCards!: Table<Card, string>;
  badges!: Table<BadgeAward, string>;

  constructor() {
    super("pianora");
    this.version(1).stores({
      profile: "id",
      lessonProgress: "id, updatedAt",
      attempts: "id, kind, refId, at",
      days: "id",
      srsCards: "id, deck, due",
      badges: "id",
    });
  }
}

export class IndexedDbProgressRepository implements ProgressRepository {
  private db = new PianoraDb();

  async load(): Promise<ProgressSnapshot> {
    const db = this.db;
    const [profile, lessons, attempts, days, cards, badges] = await Promise.all([
      db.profile.get("me"), db.lessonProgress.toArray(), db.attempts.orderBy("at").toArray(),
      db.days.toArray(), db.srsCards.toArray(), db.badges.toArray(),
    ]);
    return { profile: profile ?? emptySnapshot().profile, lessons, attempts, days, cards, badges };
  }

  async save(c: ChangeSet): Promise<void> {
    const db = this.db;
    await db.transaction("rw", [db.profile, db.lessonProgress, db.attempts, db.days, db.srsCards, db.badges], async () => {
      if (c.profile) await db.profile.put(c.profile);
      if (c.lessons) await db.lessonProgress.bulkPut(c.lessons);
      if (c.attempts) await db.attempts.bulkPut(c.attempts);
      if (c.days) await db.days.bulkPut(c.days);
      if (c.cards) await db.srsCards.bulkPut(c.cards);
      if (c.badges) await db.badges.bulkPut(c.badges);
    });
  }

  async replaceAll(s: ProgressSnapshot): Promise<void> {
    const db = this.db;
    await db.transaction("rw", [db.profile, db.lessonProgress, db.attempts, db.days, db.srsCards, db.badges], async () => {
      await Promise.all([db.profile, db.lessonProgress, db.attempts, db.days, db.srsCards, db.badges].map((t) => t.clear()));
      await this.save(s);
    });
  }
}
