import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupService } from '../group/group.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Toda query filtra por userId. Recurso de outro dono não é 403 — é 404, porque
// o filtro sequer o enxerga: não vazamos a existência do recurso alheio.
@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupService: GroupService,
  ) {}

  async create(userId: string, dto: CreateTaskDto) {
    // Barra task no grupo alheio: findOne já filtra por userId e estoura 404.
    await this.groupService.findOne(userId, dto.groupId);

    return this.prisma.task.create({
      data: { title: dto.title, groupId: dto.groupId, userId },
    });
  }

  findAll(userId: string, groupId?: string) {
    return this.prisma.task.findMany({
      where: { userId, ...(groupId ? { groupId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });

    if (!task) {
      throw new NotFoundException(`Task ${id} não encontrada.`);
    }

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    // findOne primeiro: update sem o filtro de dono editaria a task alheia.
    await this.findOne(userId, id);

    // Campos explícitos: nada do body chega ao banco sem passar por aqui.
    return this.prisma.task.update({
      where: { id },
      data: { title: dto.title, completed: dto.completed },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.task.delete({ where: { id } });
  }
}
