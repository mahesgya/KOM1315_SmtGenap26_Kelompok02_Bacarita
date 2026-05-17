import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataResponse } from 'src/core/http/http-response';
import { DatabaseSeederService } from './database-seeder.service';

@Controller('seeders')
export class DatabaseSeederController {
  constructor(
    private readonly seederService: DatabaseSeederService,
    private readonly configService: ConfigService,
  ) {}

  private checkDevelopmentMode(): void {
    const env = this.configService.get<string>('NODE_ENV');
    if (env !== 'development') {
      throw new ForbiddenException(
        'Seeder endpoints are only available in development mode',
      );
    }
  }

  @Post('all')
  @HttpCode(HttpStatus.OK)
  async seedAll(): Promise<DataResponse<{ message: string }>> {
    this.checkDevelopmentMode();

    const result = await this.seederService.seedAll();

    return new DataResponse<{ message: string }>(
      result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      result.message,
      { message: result.message },
    );
  }

  @Post('levels')
  @HttpCode(HttpStatus.OK)
  async seedLevels(): Promise<DataResponse<{ message: string }>> {
    this.checkDevelopmentMode();

    const result = await this.seederService.seedLevels();

    return new DataResponse<{ message: string }>(
      result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      result.message,
      { message: result.message },
    );
  }

  @Post('admins')
  @HttpCode(HttpStatus.OK)
  async seedAdmins(): Promise<DataResponse<{ message: string }>> {
    this.checkDevelopmentMode();

    const result = await this.seederService.seedAdmins();

    return new DataResponse<{ message: string }>(
      result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      result.message,
      { message: result.message },
    );
  }

  @Post('curators')
  @HttpCode(HttpStatus.OK)
  async seedCurators(): Promise<DataResponse<{ message: string }>> {
    this.checkDevelopmentMode();

    const result = await this.seederService.seedCurators();

    return new DataResponse<{ message: string }>(
      result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      result.message,
      { message: result.message },
    );
  }
}
