import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Sem userId: o dono vem sempre da sessão, nunca do body. A posse do groupId é
// verificada no service — class-validator não fala com o banco. groupId é
// opcional: task sem grupo é um estado válido, não um erro de preenchimento.
export class CreateTaskDto {
  @ApiProperty({ example: 'Comprar café', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Grupo dono da task; precisa ser seu. Omitido = sem grupo.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  groupId?: string;
}
