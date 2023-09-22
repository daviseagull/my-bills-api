import { UserRepository } from '@/application/repositories/user.repository'
import { AuthenticationService } from '@/application/authentication/authentication.service'
import { AppError } from '@/application/errors/app-error'

export interface ConfirmUserRequest {
  email: string
  code: string
}

export class ConfirmUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthenticationService
  ) {}

  public async execute(request: ConfirmUserRequest): Promise<void> {
    const user = this.userRepository.findByEmail(request.email)

    if (!user) {
      throw new AppError(
        `Couldn't find user in the database ${request.email}`,
        404,
        false
      )
    }

    this.authService.confirmUser(request.email, request.code)
  }
}