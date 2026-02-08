import { z } from "zod";

const scoreSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(20, "Nome deve ter no máximo 20 caracteres")
    .regex(/^[\p{L}\p{N}_\- ]+$/u, "Nome contém caracteres inválidos"),
  score: z.number().int().min(1).max(1_000_000),
  level: z.number().int().min(1).max(500),
  combo: z.number().int().min(0).max(200),
  mode: z.enum(["standard", "zen"]).default("standard"),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

function buildRequestError(message, status = 400, code = "VALIDATION_ERROR") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export class LeaderboardService {
  constructor(repository) {
    this.repository = repository;
  }

  validateListQuery(query) {
    const parsed = querySchema.safeParse(query);
    if (!parsed.success) {
      throw buildRequestError(parsed.error.issues[0]?.message || "Query inválida");
    }

    return parsed.data;
  }

  async list(query) {
    const { limit } = this.validateListQuery(query);
    return this.repository.list(limit);
  }

  validateScore(payload) {
    const parsed = scoreSchema.safeParse(payload);
    if (!parsed.success) {
      throw buildRequestError(parsed.error.issues[0]?.message || "Payload inválido");
    }

    return parsed.data;
  }

  async create(payload) {
    const data = this.validateScore(payload);

    const entry = {
      playerName: data.playerName.trim(),
      score: data.score,
      level: data.level,
      combo: data.combo,
      mode: data.mode,
      createdAt: new Date().toISOString(),
    };

    return this.repository.add(entry);
  }
}

export function getScoreSchemaForTests() {
  return scoreSchema;
}
