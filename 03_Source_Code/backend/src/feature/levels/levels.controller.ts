import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthRole } from '../auth/enums/auth.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LevelsService } from './levels.service';
import { Level } from './entities/level.entity';
import { DataResponse } from 'src/core/http/http-response';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.ANY)
  public async getLevels(): Promise<DataResponse<Level[]>> {
    const levels: Level[] = await this.levelsService.getLevels();

    return new DataResponse<Level[]>(
      200,
      `Sukses mengambil daftar level; ada ${levels.length} level`,
      levels,
    );
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.ANY)
  public async getLevelById(
    @Param('id', ParseIntPipe) levelId: number,
  ): Promise<DataResponse<Level>> {
    const level: Level = await this.levelsService.getLevelById(levelId);

    return new DataResponse<Level>(
      200,
      `Sukses mengambil data level dengan id ${level.id}`,
      level,
    );
  }
}
