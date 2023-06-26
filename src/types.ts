import {
  IsString,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
} from 'class-validator';

export class SignUpPayload {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  deficiency?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  others?: string;
}

export class ConfirmSignUpPayload {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}

export class SignInPayload {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UploadSignPayload {
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
