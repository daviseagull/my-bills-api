import {
  BadRequestError,
  InternalServerError
} from '@/application/errors/app-error'
import {
  AuthenticationResult,
  IAuthenticationService
} from '@/application/services/authentication.service'
import { SignUpRequest } from '@/application/use-cases/auth/sign-up.use-case'
import {
  AttributeType,
  CodeMismatchException,
  ExpiredCodeException,
  InvalidPasswordException,
  LimitExceededException,
  NotAuthorizedException,
  UserNotConfirmedException,
  UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider'
import { CognitoUtils } from '../utils/cognito.utils'

class UserAttribute implements AttributeType {
  private constructor(name: string, value: string) {
    this.Name = name
    this.Value = value
  }

  public static create(name: string, value: string) {
    return new UserAttribute(name, value)
  }

  Name: string | undefined
  Value: string
}

export class CognitoService implements IAuthenticationService {
  async signIn(
    username: string,
    password: string
  ): Promise<AuthenticationResult> {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CognitoUtils.cognitoClientId(),
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: CognitoUtils.hashCognitoSecret(username)
      }
    }
    try {
      const data =
        await CognitoUtils.cognitoServiceProvider().initiateAuth(params)
      return {
        status: 'OK',
        accessToken: data.AuthenticationResult!.AccessToken!,
        type: 'Bearer'
      }
    } catch (err) {
      if (err instanceof UserNotConfirmedException) {
        throw new BadRequestError(`User ${username} isn't confirmed`)
      }
      if (err instanceof NotAuthorizedException) {
        throw new BadRequestError('Invalid username or password')
      }

      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to authenticate',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to authenticate'
      )
    }
  }

  async signUp(user: SignUpRequest): Promise<string> {
    const params = {
      ClientId: CognitoUtils.cognitoClientId(),
      Password: user.password,
      Username: user.email,
      SecretHash: CognitoUtils.hashCognitoSecret(user.email),
      UserAttributes: this.getUserAttributes(user)
    }

    try {
      const cognitoUser =
        await CognitoUtils.cognitoServiceProvider().signUp(params)

      return cognitoUser.UserSub!
    } catch (err) {
      if (err instanceof UsernameExistsException) {
        throw new BadRequestError(
          `User with email ${user.email} already exists`
        )
      }

      if (err instanceof InvalidPasswordException) {
        throw new BadRequestError(err.message)
      }

      if (err instanceof Error) {
        throw new InternalServerError(
          `Unknown error while trying to create user in IAM`,
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        `Unknown error while trying to create user in IAM`
      )
    }
  }

  private getUserAttributes(user: SignUpRequest): UserAttribute[] {
    const userAttr: UserAttribute[] = []
    userAttr.push(UserAttribute.create('email', user.email))
    userAttr.push(UserAttribute.create('birthdate', user.birthday.toString()))
    userAttr.push(
      UserAttribute.create('name', `${user.name.first} ${user.name.last}`)
    )
    userAttr.push(UserAttribute.create('given_name', user.name.first))
    userAttr.push(UserAttribute.create('family_name', user.name.last))
    userAttr.push(
      UserAttribute.create(
        'phone_number',
        `${user.phone.country}${user.phone.areaCode}${user.phone.number}`
      )
    )

    return userAttr
  }

  async confirmUser(email: string, code: string): Promise<void> {
    const params = {
      ClientId: CognitoUtils.cognitoClientId(),
      ConfirmationCode: code,
      Username: email,
      SecretHash: CognitoUtils.hashCognitoSecret(email)
    }
    try {
      await CognitoUtils.cognitoServiceProvider().confirmSignUp(params)
    } catch (err) {
      if (err instanceof ExpiredCodeException) {
        throw new BadRequestError('Code has expired')
      }

      if (err instanceof CodeMismatchException) {
        throw new BadRequestError(
          "Code doesn't match with what server was expecting"
        )
      }

      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to confirm user',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to confirm user'
      )
    }
  }

  async resendConfirmationCode(email: string) {
    const params = {
      ClientId: CognitoUtils.cognitoClientId(),
      SecretHash: CognitoUtils.hashCognitoSecret(email),
      Username: email
    }
    try {
      await CognitoUtils.cognitoServiceProvider().resendConfirmationCode(params)
    } catch (err) {
      if (err instanceof LimitExceededException) {
        throw new InternalServerError(
          'Attempt limit exceeded, please try after some time'
        )
      }

      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to resend confirmation code',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to resend confirmation code'
      )
    }
  }

  async forgotPassword(email: string) {
    const params = {
      ClientId: CognitoUtils.cognitoClientId(),
      SecretHash: CognitoUtils.hashCognitoSecret(email),
      Username: email
    }

    try {
      await CognitoUtils.cognitoServiceProvider().forgotPassword(params)
    } catch (err) {
      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to forgot password',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to forgot password'
      )
    }
  }

  async confirmResetPassword(
    email: string,
    code: string,
    password: string
  ): Promise<void> {
    const params = {
      ClientId: CognitoUtils.cognitoClientId(),
      SecretHash: CognitoUtils.hashCognitoSecret(email),
      Username: email,
      ConfirmationCode: code,
      Password: password
    }

    try {
      await CognitoUtils.cognitoServiceProvider().confirmForgotPassword(params)
    } catch (err) {
      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to resend confirmation code',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to resend confirmation code'
      )
    }
  }

  async signOut(token: string): Promise<void> {
    const params = {
      AccessToken: token
    }

    try {
      await CognitoUtils.cognitoServiceProvider().globalSignOut(params)
    } catch (err) {
      if (err instanceof Error) {
        throw new InternalServerError(
          'Unknown error while trying to resend confirmation code',
          err.name,
          err.stack
        )
      }

      throw new InternalServerError(
        'Unknown error while trying to resend confirmation code'
      )
    }
  }
}
