import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindTasksQueryDto {
  @ApiPropertyOptional({ description: 'Filtra as tasks de um grupo seu.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  groupId?: string;

  @ApiPropertyOptional({
    description:
      'Filtra só as tasks sem grupo. Ignora `groupId` se os dois vierem juntos.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ungrouped?: boolean;
}
