import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  // GroupModule entra pelo GroupService: é ele que valida a posse do groupId.
  imports: [GroupModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
