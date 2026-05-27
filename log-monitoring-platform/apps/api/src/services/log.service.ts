import { LogModel, type CreateLogInput } from "../models/log.model";

export async function createLog(input: CreateLogInput) {
  return LogModel.insertMany([input]);
}

export async function getLogsForUser(userId: number | string, limit = 50) {
  return LogModel.findByUserId(userId, limit);
}