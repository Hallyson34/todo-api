import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Não estende CreateTaskDto de propósito: mover a task de grupo não faz parte
// do contrato, então groupId não é atualizável.
export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Comprar café', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
