import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Sem userId: o dono vem sempre da sessão, nunca do body. A posse do groupId é
// verificada no service — class-validator não fala com o banco.
export class CreateTaskDto {
  @ApiProperty({ example: 'Comprar café', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Grupo dono da task; precisa ser seu.' })
  @IsString()
  @IsNotEmpty()
  groupId!: string;
}
