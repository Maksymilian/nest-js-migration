import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

/** Workout Tracking's environment variables. The service doesn't start without valid ones. */
export class Environment {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  /** PostgreSQL instance 1, e.g. postgres://workout_tracking:workout_tracking@localhost:5433/workout_tracking */
  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  /** e.g. amqp://fitness:fitness@localhost:5672 */
  @IsString()
  @MinLength(1)
  RABBITMQ_URL: string;

  /** `off` in instances that only accept requests and leave publishing to other instances. */
  @IsIn(['on', 'off'])
  OUTBOX_RELAY: 'on' | 'off' = 'on';

  /** Protects the dead-letter admin routes. Without it, they answer 403. */
  @IsOptional()
  @IsString()
  @MinLength(16)
  ADMIN_TOKEN?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const environment = plainToInstance(Environment, config, { enableImplicitConversion: true });
  const errors = validateSync(environment, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.map((error) => `- ${Object.values(error.constraints ?? {}).join(', ')}`).join('\n')}`);
  }
  return environment;
}
