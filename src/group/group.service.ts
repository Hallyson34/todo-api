import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

// Toda query filtra por userId. Recurso de outro dono não é 403 — é 404, porque
// o filtro sequer o enxerga: não vazamos a existência do recurso alheio.
@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({ data: { name: dto.name, userId } });
  }

  findAll(userId: string) {
    return this.prisma.group.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const group = await this.prisma.group.findFirst({ where: { id, userId } });

    if (!group) {
      throw new NotFoundException(`Grupo ${id} não encontrado.`);
    }

    return group;
  }

  async update(userId: string, id: string, dto: UpdateGroupDto) {
    // findOne primeiro: updateMany não distingue "não existe" de "não é seu",
    // e ambos os casos devem virar 404.
    await this.findOne(userId, id);

    // Campos explícitos: nada do body chega ao banco sem passar por aqui.
    return this.prisma.group.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.group.delete({ where: { id } });
  }
}
