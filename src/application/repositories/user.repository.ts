import { User } from '@/domain/entities/user.entity'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByCognitoId(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<User>
  confirmUser(id: string): Promise<void>
}
