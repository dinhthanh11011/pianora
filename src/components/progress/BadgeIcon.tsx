import { Brain, Clock, Flag, Flame, Footprints, Hand, Music, Star, Trophy, Zap, type LucideIcon } from "lucide-react";
import { BADGES, type BadgeDef } from "@/lib/gamification/badges";

const ICONS: Record<BadgeDef["icon"], LucideIcon> = {
  footprints: Footprints, flag: Flag, flame: Flame, zap: Zap, star: Star, hand: Hand, brain: Brain, clock: Clock, music: Music, trophy: Trophy,
};

export const badgeIcon = (id: string): LucideIcon => ICONS[BADGES.find((b) => b.id === id)?.icon ?? "trophy"];
