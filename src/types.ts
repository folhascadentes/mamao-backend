import {
  IsString,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsObject,
} from 'class-validator';

export class UploadSignPayload {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsNumber()
  timestamp: number;

  @IsNotEmpty()
  @IsString()
  path: string;

  @IsObject()
  landmarks: any;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  frames: string[]; // jpeg;base64
}
