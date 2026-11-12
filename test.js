import { createClient } from "./client";
import { cache } from "./cache";
import { logger } from "./logger";
import { metrics } from "./metrics";

const config = {
  timeout: 5000,
  retries: 3,
  cache: true,
  cacheTtl: 300,
  logLevel: "warn",
  retryDelay: 500,
  maxConnections: 10,
};

function getClient() {
  return createClient({
    timeout: config.timeout,
    retries: config.retries,
    retryDelay: config.retryDelay,
    maxConnections: config.maxConnections,
  });
}

function validateId(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name?.trim() || "",
    email: user.email.toLowerCase(),
    role: user.role || "member",
    active: user.status === "active",
    teamId: user.teamId,
    joinedAt: user.createdAt,
  };
}

export async function fetchUsers(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const cacheKey = `teams:${teamId}:users`;
  const cached = config.cache ? cache.get(cacheKey) : null;
  const startedAt = Date.now();

  if (cached) {
    metrics.increment("users.cache_hit", { teamId });
    return cached;
  }

  const response = await client.get(`/teams/${teamId}/users`);
  const users = response.data.users.map(normalizeUser);
  if (config.cache) {
    cache.set(cacheKey, users, config.cacheTtl);
  }
  logger.info("Fetched team users", { teamId, count: users.length });
  metrics.timing("users.fetch", Date.now() - startedAt, { teamId });

  return users;
}

export async function fetchUser(userId) {
  validateId(userId, "userId");
  const client = getClient();
  const response = await client.get(`/users/${userId}`);
  const user = normalizeUser(response.data.user);

  logger.debug("Fetched user", { userId });
  metrics.increment("users.fetched");
  return user;
}

export async function createUser(teamId, input) {
  validateId(teamId, "teamId");
  const client = getClient();
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role || "member",
    sendWelcomeEmail: input.sendWelcomeEmail ?? true,
  };

  const response = await client.post(`/teams/${teamId}/users`, payload);
  const user = normalizeUser(response.data.user);
  cache.delete(`teams:${teamId}:users`);
  logger.info("Created team user", { userId: user.id, teamId });
  metrics.increment("users.created", { teamId });

  return user;
}

export async function updateUser(userId, changes) {
  validateId(userId, "userId");
  const client = getClient();
  const response = await client.patch(`/users/${userId}`, changes);
  const user = normalizeUser(response.data.user);

  cache.delete(`teams:${user.teamId}:users`);
  logger.info("Updated team user", { userId, teamId: user.teamId });
  metrics.increment("users.updated", { teamId: user.teamId });

  return user;
}

export async function deleteUser(userId) {
  validateId(userId, "userId");
  const client = getClient();
  const response = await client.delete(`/users/${userId}`);
  const teamId = response.data.teamId;
  cache.delete(`teams:${teamId}:users`);
  metrics.increment("users.deleted", { teamId });

  logger.info("Deleted user", { userId });
}

export async function searchUsers(teamId, query) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}/users/search`, {
    params: { query: query.trim(), limit: 50 },
  });

  return response.data.users.map(normalizeUser);
}

export async function fetchTeam(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}`);

  return {
    id: response.data.id,
    name: response.data.name,
    members: response.data.memberCount,
    plan: response.data.plan,
    createdAt: response.data.createdAt,
  };
}

export async function updateTeam(teamId, changes) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.patch(`/teams/${teamId}`, changes);

  cache.delete(`teams:${teamId}:summary`);
  logger.info("Updated team settings", { teamId });
  metrics.increment("teams.updated", { teamId });
  return response.data;
}

export async function fetchActivity(teamId, cursor = null) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}/activity`, {
    params: { cursor, limit: 25 },
  });

  const events = response.data.events.map((event) => ({
    id: event.id,
    type: event.type,
    userId: event.userId,
    createdAt: new Date(event.createdAt).toISOString(),
    metadata: event.metadata || {},
  }));

  return { events, nextCursor: response.data.nextCursor };
}

export async function exportUsers(teamId) {
  const users = await fetchUsers(teamId);
  const header = ["Name", "Email", "Role", "Status"];
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role,
    user.active ? "Active" : "Inactive",
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function getUserLabel(user) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

export function canManageUsers(user) {
  return user.active && ["owner", "admin"].includes(user.role);
}

export function sortUsers(users) {
  return [...users].sort((a, b) => getUserLabel(a).localeCompare(getUserLabel(b)));
}

export function filterActiveUsers(users) {
  return users.filter((user) => user.active);
}

export function getTeamSummary(team, users) {
  return {
    id: team.id,
    name: team.name,
    totalUsers: users.length,
    activeUsers: filterActiveUsers(users).length,
    pendingUsers: users.filter((user) => !user.active).length,
    admins: users.filter(canManageUsers).length,
    plan: team.plan,
  };
}

export function clearCache() {
  const entryCount = cache.size;
  cache.clear();
  logger.info("User cache cleared", { entryCount });
  metrics.increment("cache.cleared");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function inviteUser(teamId, email, role = "member") {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.post(`/teams/${teamId}/invitations`, {
    email: email.trim().toLowerCase(),
    role,
  });

  logger.info("Invited user", { teamId });
  metrics.increment("users.invited", { teamId });
  return response.data.invitation;
}

export async function revokeInvitation(teamId, invitationId) {
  validateId(teamId, "teamId");
  validateId(invitationId, "invitationId");
  const client = getClient();
  await client.delete(`/teams/${teamId}/invitations/${invitationId}`);

  logger.info("Revoked invitation", { teamId, invitationId });
  metrics.increment("invitations.revoked", { teamId });
}

export async function fetchInvitations(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}/invitations`);

  return response.data.invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  }));
}

export async function changeUserRole(userId, role) {
  const allowedRoles = ["owner", "admin", "member", "viewer"];
  if (!allowedRoles.includes(role)) {
    throw new TypeError(`Unsupported role: ${role}`);
  }

  return updateUser(userId, { role });
}

export async function deactivateUser(userId) {
  return updateUser(userId, { status: "inactive" });
}

export async function reactivateUser(userId) {
  return updateUser(userId, { status: "active" });
}
