// Публичный API модуля users. Другие модули импортируют только отсюда
// и взаимодействуют с users через CommandBus / QueryBus / EventBus.
export { ChangeUserPasswordCommand } from '../commands/change-user-password.command';
export { CreateUserCommand } from '../commands/create-user.command';
export { RecordUserLoginCommand } from '../commands/record-user-login.command';
export { UserPasswordChangedEvent } from '../events/user-password-changed.event';
export { UserRegisteredEvent } from '../events/user-registered.event';
export { GetUserByIdQuery } from '../queries/get-user-by-id.query';
export { GetUserCredentialsQuery, type UserLookup } from '../queries/get-user-credentials.query';
export type { UserCredentials } from './user-credentials';
