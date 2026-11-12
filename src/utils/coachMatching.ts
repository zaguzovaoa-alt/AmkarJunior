import { Client, Coach, TrainingGroup, TrainingSessionProtocol } from "../types";
import { isGroupMatch } from "./sessionMatching";

/**
 * Normalizes a phone number to its last 10 digits (Russian mobile standard)
 * so that "89058355550", "+7 (905) 835-55-50", and "79058355550" match identically.
 */
export function normalizePhone10(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

const CANONICAL_NAME_TOKENS: Record<string, string> = {
  данила: "данил",
  даниил: "данил",
  данил: "данил",
  наталия: "наталья",
  наталья: "наталья",
  софия: "софья",
  софья: "софья",
  марья: "мария",
  мария: "мария",
  дария: "дарья",
  дарья: "дарья",
  алеся: "олеся",
  олеся: "олеся",
  геннадиевич: "геннадьевич",
  геннадьевич: "геннадьевич",
  геннадиевна: "геннадьевна",
  геннадьевна: "геннадьевна",
  валериевич: "валерьевич",
  валерьевич: "валерьевич",
  валериевна: "валерьевна",
  валерьевна: "валерьевна",
  анатолиевич: "анатольевич",
  анатольевич: "анатольевич",
  анатолиевна: "анатольевна",
  анатольевна: "анатольевна",
  виталиевич: "витальевич",
  витальевич: "витальевич",
  витальевичч: "витальевич",
  василиевич: "васильевич",
  васильевич: "васильевич",
  евгениевич: "евгеньевич",
  евгеньевич: "евгеньевич",
  евгениевна: "евгеньевна",
  евгеньевна: "евгеньевна",
  юриевич: "юрьевич",
  юрьевич: "юрьевич",
  юриевна: "юрьевна",
  юрьевна: "юрьевна",
};

/**
 * Normalizes a single Russian word token (lowercase, ё->е, canonical spelling variants).
 */
export function normalizeNameToken(token: string): string {
  const cleaned = token
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]/gi, "")
    .trim();
  if (!cleaned) return "";
  return CANONICAL_NAME_TOKENS[cleaned] || cleaned;
}

/**
 * Tokenizes a single person's name into normalized word tokens.
 */
export function tokenizePersonName(name?: string | null): string[] {
  if (!name) return [];
  // Strip role prefixes if accidentally present
  const stripped = name
    .replace(/^(тренер|главный тренер|старший тренер|директор|администратор)\s+/i, "")
    .trim();
  return stripped
    .split(/[\s.]+/)
    .map(normalizeNameToken)
    .filter(Boolean);
}

/**
 * Compares two single-person name strings for equivalence.
 * Handles:
 * - "Никонов Данила Владимирович" vs "Никонов Данил Владимирович"
 * - "Никонов Данила Владимирович" vs "Никонов Данила"
 * - "Данила Никонов" vs "Никонов Данила Владимирович"
 * - "Никонов Д. В." vs "Никонов Данила Владимирович"
 */
function isSinglePersonNameMatch(candA: string, candB: string): boolean {
  const tokensA = tokenizePersonName(candA);
  const tokensB = tokenizePersonName(candB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Exact single token match only if both are 1 token and length >= 4
  if (tokensA.length === 1 && tokensB.length === 1) {
    return tokensA[0].length >= 4 && tokensA[0] === tokensB[0];
  }

  // Full token set match when both have >= 2 full words
  const fullWordsA = tokensA.filter((t) => t.length > 1);
  const fullWordsB = tokensB.filter((t) => t.length > 1);

  if (fullWordsA.length >= 2 && fullWordsB.length >= 2) {
    const shorter = fullWordsA.length <= fullWordsB.length ? fullWordsA : fullWordsB;
    const longer = fullWordsA.length <= fullWordsB.length ? fullWordsB : fullWordsA;
    // Every word in shorter (e.g. ["никонов", "данил"]) must exist in longer (e.g. ["никонов", "данил", "владимирович"])
    const allShorterMatch = shorter.every((w) => longer.includes(w));
    if (allShorterMatch) return true;
  }

  // Handle Surname + Initial(s), e.g. "Никонов Д. В." vs "Никонов Данила Владимирович"
  if (tokensA[0].length >= 3 && tokensA[0] === tokensB[0] && tokensA.length >= 2 && tokensB.length >= 2) {
    const hasInitialA = tokensA.slice(1).some((t) => t.length === 1);
    const hasInitialB = tokensB.slice(1).some((t) => t.length === 1);
    if (hasInitialA || hasInitialB) {
      const firstInitMatch = tokensA[1][0] === tokensB[1][0];
      if (!firstInitMatch) return false;
      if (tokensA.length >= 3 && tokensB.length >= 3) {
        return tokensA[2][0] === tokensB[2][0];
      }
      return true;
    }
  }

  return false;
}

/**
 * Checks if two coach name strings refer to the same coach.
 * Supports composite strings like "Никонов Данил Владимирович, Бондарева Ксения Сергеевна".
 */
export function isSameCoachName(nameA?: string | null, nameB?: string | null): boolean {
  if (!nameA || !nameB) return false;
  const listA = nameA
    .split(/[,/;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const listB = nameB
    .split(/[,/;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const a of listA) {
    for (const b of listB) {
      if (isSinglePersonNameMatch(a, b)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a group belongs to a coach (given all of the coach's IDs and known name variants).
 */
export function isGroupAssignedToCoach(
  group: TrainingGroup,
  coachIds: Set<string>,
  coachNames: string[]
): boolean {
  if (!group) return false;
  if (group.coachId && coachIds.has(group.coachId)) {
    return true;
  }
  if (group.coachName) {
    for (const name of coachNames) {
      if (isSameCoachName(group.coachName, name)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a training session protocol belongs to a coach (as main coach, assistant, or via group).
 */
export function isSessionAssignedToCoach(
  session: TrainingSessionProtocol,
  coachIds: Set<string>,
  coachNames: string[],
  coachGroups?: TrainingGroup[]
): boolean {
  if (!session) return false;
  if (session.coachId && coachIds.has(session.coachId)) return true;
  if (session.assistantId && coachIds.has(session.assistantId)) return true;

  for (const name of coachNames) {
    if (session.coachName && isSameCoachName(session.coachName, name)) return true;
    if (session.assistantName && isSameCoachName(session.assistantName, name)) return true;
  }

  if (coachGroups && coachGroups.length > 0) {
    if (
      coachGroups.some((g) =>
        isGroupMatch(session.groupId, session.groupName, g.id, g.name)
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates the real number of active players in a group from the clients collection,
 * falling back to group.playersCount only if no active clients match.
 */
export function getGroupActualPlayersCount(
  group: TrainingGroup,
  clients: Client[]
): number {
  if (!group) return 0;
  const activeClients = (clients || []).filter((c) => c.status !== "inactive");
  const matchedCount = group.isSelectTeam
    ? activeClients.filter((c) => group.selectedClientIds?.includes(c.id)).length
    : activeClients.filter((c) =>
        isGroupMatch(undefined, c.groupName, group.id, group.name)
      ).length;

  return matchedCount > 0 ? matchedCount : group.playersCount || 0;
}

/**
 * Resolves the current trainer's Coach profile, all matching Coach IDs (across duplicate records),
 * and all matching name variants so that groups, clients, schedules, and sessions always match.
 */
export function resolveTrainerIdentity(params: {
  coaches: Coach[];
  groups: TrainingGroup[];
  appUser?: {
    uid?: string | null;
    fullName?: string | null;
    phone?: string | null;
    role?: string | null;
  } | null;
  overrideCoachId?: string | null;
}): {
  myCoach: Coach;
  coachIds: Set<string>;
  coachNames: string[];
  matchedCoaches: Coach[];
} {
  const { coaches = [], groups = [], appUser, overrideCoachId } = params;

  const userPhone10 = normalizePhone10(appUser?.phone);
  const userFullName = (appUser?.fullName || "").trim();

  let matchedCoaches: Coach[] = [];

  // 1. If explicit overrideCoachId is provided and valid, match that coach + any duplicates of that coach
  if (overrideCoachId) {
    const target = coaches.find((c) => c.id === overrideCoachId);
    if (target) {
      const targetPhone10 = normalizePhone10(target.phone);
      matchedCoaches = coaches.filter(
        (c) =>
          c.id === target.id ||
          (targetPhone10 && normalizePhone10(c.phone) === targetPhone10) ||
          isSameCoachName(c.name, target.name)
      );
    }
  }

  // 2. Otherwise match by logged-in appUser (uid, normalized phone, or fuzzy Russian name)
  if (matchedCoaches.length === 0 && appUser) {
    const directMatches = coaches.filter(
      (c) =>
        (appUser.uid && c.id === appUser.uid) ||
        (userPhone10 && normalizePhone10(c.phone) === userPhone10) ||
        (userFullName && isSameCoachName(c.name, userFullName))
    );

    if (directMatches.length > 0) {
      // Expand to include any other coach records that share a name or phone with any direct match
      const seedNames = [
        ...new Set([
          userFullName,
          ...directMatches.map((c) => c.name).filter(Boolean),
        ]),
      ];
      const seedPhones = new Set(
        [userPhone10, ...directMatches.map((c) => normalizePhone10(c.phone))].filter(
          Boolean
        )
      );

      matchedCoaches = coaches.filter(
        (c) =>
          directMatches.some((dm) => dm.id === c.id) ||
          (normalizePhone10(c.phone) && seedPhones.has(normalizePhone10(c.phone))) ||
          seedNames.some((n) => isSameCoachName(c.name, n))
      );
    }
  }

  // Sort matched coaches so that the record with the most groups assigned in `groups` comes first
  const countGroupsForCoachRecord = (c: Coach) =>
    groups.filter(
      (g) => g.coachId === c.id || isSameCoachName(g.coachName, c.name)
    ).length;

  matchedCoaches.sort((a, b) => {
    const ga = countGroupsForCoachRecord(a);
    const gb = countGroupsForCoachRecord(b);
    if (gb !== ga) return gb - ga;
    // Prefer record with a phone number
    if (Boolean(b.phone) !== Boolean(a.phone)) return b.phone ? 1 : -1;
    return 0;
  });

  const primaryCoach: Coach = matchedCoaches[0] || {
    id: appUser?.uid || "coach_current",
    name: userFullName || coaches[0]?.name || "Тренер",
    role: appUser?.role === "director" ? "Директор" : "Тренер",
    phone: appUser?.phone || "",
    telegram: "",
    status: "Активен",
    joinedYear: new Date().getFullYear(),
    rating: 5,
    avatarUrl: "",
    groupsCount: 0,
    kidsCount: 0,
    workload: 0,
    paymentType: "per_session",
    rate: 1000,
    feedback: {
      professionalism: 5,
      communication: 5,
      results: 5,
      discipline: 5,
    },
  };

  // Build comprehensive set of coach IDs and names
  const coachIds = new Set<string>();
  if (primaryCoach.id) coachIds.add(primaryCoach.id);
  if (appUser?.uid && (!overrideCoachId || matchedCoaches.some((c) => c.id === appUser.uid))) {
    coachIds.add(appUser.uid);
  }
  matchedCoaches.forEach((c) => {
    if (c.id) coachIds.add(c.id);
  });

  const nameSet = new Set<string>();
  if (primaryCoach.name) nameSet.add(primaryCoach.name);
  if (userFullName && !overrideCoachId) nameSet.add(userFullName);
  matchedCoaches.forEach((c) => {
    if (c.name) nameSet.add(c.name);
  });

  // Also add any coachId found on groups that match by coachName so ScheduleCalendar and other ID-based filters work seamlessly
  const coachNames = Array.from(nameSet);
  groups.forEach((g) => {
    if (g.coachId && g.coachName && coachNames.some((n) => isSameCoachName(g.coachName, n))) {
      coachIds.add(g.coachId);
    }
  });

  // Ensure display name prefers the full name with patronymic if available
  const bestDisplayName =
    [userFullName && !overrideCoachId ? userFullName : "", ...matchedCoaches.map((c) => c.name)]
      .filter(Boolean)
      .sort((a, b) => b.trim().split(/\s+/).length - a.trim().split(/\s+/).length)[0] ||
    primaryCoach.name;

  const resolvedCoach: Coach = {
    ...primaryCoach,
    name: bestDisplayName,
    phone:
      primaryCoach.phone ||
      matchedCoaches.find((c) => c.phone)?.phone ||
      (!overrideCoachId ? appUser?.phone || "" : ""),
    avatarUrl:
      primaryCoach.avatarUrl ||
      matchedCoaches.find((c) => c.avatarUrl)?.avatarUrl ||
      "",
  };

  return {
    myCoach: resolvedCoach,
    coachIds,
    coachNames,
    matchedCoaches,
  };
}
