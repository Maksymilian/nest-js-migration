import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { MissEndedGoalsCommand } from '../../application/commands/miss-ended-goals.command.js';
import { ScheduleTriggersController } from './schedule-triggers.controller.js';

const trigger = {
  specversion: '1.0',
  id: '0199c3a2-0000-7000-8000-000000000901',
  source: '/scheduler',
  type: 'training-progress.schedule.miss-ended-goals.v1',
  time: '2026-12-02T00:05:00.000Z',
};

/** The RabbitMQ context of one delivery, with the channel that acks or nacks it. */
function delivery() {
  const channel = { ack: vi.fn(), nack: vi.fn() };
  const message = { content: Buffer.from(JSON.stringify(trigger)) };
  return { channel, message, context: { getChannelRef: () => channel, getMessage: () => message } };
}

describe('ScheduleTriggersController', () => {
  let controller: ScheduleTriggersController;
  const commandBus = { execute: vi.fn() };

  beforeEach(async () => {
    commandBus.execute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleTriggersController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<ScheduleTriggersController>(ScheduleTriggersController);
  });

  it('misses the ended goals as of now, then acks the trigger', async () => {
    commandBus.execute.mockResolvedValue(2);
    const { channel, message, context } = delivery();
    const before = Date.now();

    await controller.missEndedGoals(trigger, context);

    const [command] = commandBus.execute.mock.calls[0] as [MissEndedGoalsCommand];
    expect(command).toBeInstanceOf(MissEndedGoalsCommand);
    expect(command.now.getTime()).toBeGreaterThanOrEqual(before);
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('requeues the trigger when missing the ended goals fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('Connection terminated'));
    const { channel, message, context } = delivery();

    await controller.missEndedGoals(trigger, context);

    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
