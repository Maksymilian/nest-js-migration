import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

/** Training Progress' environment variables. The service doesn't start without valid ones. */
export class Environment {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3002;

  /** PostgreSQL instance 2, e.g. postgres://training_progress:training_progress@localhost:5434/training_progress */
  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  /** e.g. redis://localhost:6379 */
  @IsString()
  @MinLength(1)
  REDIS_URL: string;

  /** e.g. amqp://fitness:fitness@localhost:5672 */
  @IsString()
  @MinLength(1)
  RABBITMQ_URL: string;

  /** `off` in instances that leave the outbox's local handlers to other instances. */
  @IsIn(['on', 'off'])
  OUTBOX_RELAY: 'on' | 'off' = 'on';

  /** Protects the dead-letter admin routes. Without it, they answer 403. */
  @IsOptional()
  @IsString()
  @MinLength(16)
  ADMIN_TOKEN?: string;

  /** `file` (development: .eml files in MAIL_DIRECTORY), `smtp` or `resend`. */
  @IsIn(['file', 'smtp', 'resend'])
  MAIL_TRANSPORT: 'file' | 'smtp' | 'resend' = 'file';

  @IsString()
  MAIL_DIRECTORY: string = 'var/mail';

  @IsString()
  MAIL_FROM: string = 'Fitness Platform <progress@fitness.example>';

  /** Required with MAIL_TRANSPORT=smtp, e.g. smtp://user:password@smtp.example.com:587 */
  @IsOptional()
  @IsString()
  SMTP_URL?: string;

  /** Required with MAIL_TRANSPORT=resend. */
  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const environment = plainToInstance(Environment, config, { enableImplicitConversion: true });
  const errors = validateSync(environment, { skipMissingProperties: false });
  if (environment.MAIL_TRANSPORT === 'smtp' && !environment.SMTP_URL) {
    throw new Error('Invalid environment:\n- SMTP_URL is required when MAIL_TRANSPORT is smtp');
  }
  if (environment.MAIL_TRANSPORT === 'resend' && !environment.RESEND_API_KEY) {
    throw new Error('Invalid environment:\n- RESEND_API_KEY is required when MAIL_TRANSPORT is resend');
  }
  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.map((error) => `- ${Object.values(error.constraints ?? {}).join(', ')}`).join('\n')}`);
  }
  return environment;
}
