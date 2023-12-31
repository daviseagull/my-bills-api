import { IUserRepository } from '@/application/repositories/user.repository'
import { PasswordUtils } from '@/application/utils/password.utils'
import { User } from '@/domain/entities/user.entity'
import { Email } from '@/domain/value-objects/email'
import { FiscalDocument } from '@/domain/value-objects/fiscal-document'
import { Name } from '@/domain/value-objects/name'
import { inject, injectable } from 'tsyringe'
import { SignUpRequest } from '../auth/sign-up.use-case'
import { CreateDefaultCategoryUseCase } from '../category/create-default-categories.use-case'

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject('UserRepository') private userRepository: IUserRepository,
    @inject('CreateDefaultCategoryUseCase')
    private categoryUseCase: CreateDefaultCategoryUseCase
  ) {}

  public async execute(
    request: SignUpRequest,
    cognitoId: string
  ): Promise<User> {
    const newUser = User.create({
      email: Email.create(request.email),
      fiscalDocument: FiscalDocument.create(request.fiscalDocument),
      birthday: new Date(request.birthday),
      gender: request.gender,
      phone: request.phone,
      name: Name.create(request.name.first, request.name.last),
      cognitoId: cognitoId,
      confirmed: false
    })

    PasswordUtils.validatePassword(request.password)

    const user = await this.userRepository.create(newUser)

    this.categoryUseCase.execute(user.props.cognitoId!)

    return user
  }
}
