import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Sem userId: o dono vem sempre da sessão, nunca do body.
export class CreateGroupDto {
  @ApiProperty({ example: 'Compras', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
