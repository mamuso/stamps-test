import { createClient } from "./client";
import { cache } from "./cache";
import { logger } from "./logger";

const config = {
  timeout: 1000,
  retries: 2,
  cache: false,
  cacheTtl: 60,
  logLevel: "error",
};

function getClient() {
  return createClient({ timeout: config.timeout });
}

function validateId(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    active: Boolean(user.active),
  };
}

export async function fetchUsers(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const cacheKey = "users";
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await client.get("/users");
  const users = response.data.map(normalizeUser);
  cache.set(cacheKey, users, config.cacheTtl);
  logger.info("Fetched users", { count: users.length });

  return users;
}

export async function fetchUser(userId) {
  validateId(userId, "userId");
  const client = getClient();
  const response = await client.get(`/users/${userId}`);
  const user = normalizeUser(response.data);

  logger.info("Fetched user", { userId });
  return user;
}

export async function createUser(teamId, input) {
  validateId(teamId, "teamId");
  const client = getClient();
  const payload = {
    name: input.name,
    email: input.email,
    role: input.role || "user",
  };

  const response = await client.post("/users", payload);
  const user = normalizeUser(response.data);
  cache.delete("users");
  logger.info("Created user", { userId: user.id });

  return user;
}

export async function updateUser(userId, changes) {
  validateId(userId, "userId");
  const client = getClient();
  const response = await client.put(`/users/${userId}`, changes);
  const user = normalizeUser(response.data);

  cache.delete("users");
  logger.info("Updated user", { userId });

  return user;
}

export async function deleteUser(userId) {
  validateId(userId, "userId");
  const client = getClient();
  await client.delete(`/users/${userId}`);
  cache.delete("users");

  logger.info("Deleted user", { userId });
}

export async function searchUsers(teamId, query) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get("/users/search", {
    params: { query },
  });

  return response.data.map(normalizeUser);
}

export async function fetchTeam(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}`);

  return {
    id: response.data.id,
    name: response.data.name,
    members: response.data.members,
  };
}

export async function updateTeam(teamId, changes) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.put(`/teams/${teamId}`, changes);

  logger.info("Updated team", { teamId });
  return response.data;
}

export async function fetchActivity(teamId) {
  validateId(teamId, "teamId");
  const client = getClient();
  const response = await client.get(`/teams/${teamId}/activity`);

  return response.data.map((event) => ({
    id: event.id,
    type: event.type,
    userId: event.userId,
    createdAt: event.createdAt,
  }));
}

export async function exportUsers(teamId) {
  const users = await fetchUsers(teamId);
  const header = ["Name", "Email", "Role"];
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role,
  ]);

  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

export function getUserLabel(user) {
  if (user.name) {
    return user.name;
  }

  return user.email;
}

export function canManageUsers(user) {
  return user.role === "admin";
}

export function sortUsers(users) {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
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
  };
}

export function printUsers(users) {
  for (const user of users) {
    console.log(`${user.name} <${user.email}>`);
  }
}

export function clearCache() {
  cache.clear();
  logger.info("Cache cleared");
}
