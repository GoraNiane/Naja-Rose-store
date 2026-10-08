import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export abstract class BaseRepository {
  protected db: PrismaClient;

  constructor() {
    this.db = prisma;
  }
}
