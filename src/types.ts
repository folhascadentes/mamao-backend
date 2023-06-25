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
  @IsObject({ each: true })
  @IsArray()
  landmarks: any;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  frames: string[]; // jpeg;base64
}
