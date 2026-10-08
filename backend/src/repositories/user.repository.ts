import { BaseRepository } from './base.repository.js';
import { Role } from '../types/index.js';

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
}

export class UserRepository extends BaseRepository {
  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { customer: true },
    });
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { customer: true },
    });
  }

  async create(data: CreateUserData) {
    return this.db.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || Role.CUSTOMER,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.db.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
