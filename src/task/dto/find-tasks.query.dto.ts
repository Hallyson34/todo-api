import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindTasksQueryDto {
  @ApiPropertyOptional({ description: 'Filtra as tasks de um grupo seu.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  groupId?: string;
}
