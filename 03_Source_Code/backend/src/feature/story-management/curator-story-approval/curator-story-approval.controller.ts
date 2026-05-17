import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from 'src/feature/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/feature/auth/decorators/current-user.decorator';
import { AuthRole } from 'src/feature/auth/enums/auth.enum';
import { AuthGuard } from 'src/feature/auth/guards/auth.guard';
import { ICurrentUser } from 'src/feature/auth/interfaces/current-user.interfaces';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { CuratorService } from 'src/feature/users/curator/curator.service';
import { CuratorStoryApprovalService } from './curator-story-approval.service';
import { ApproveStoryDTO } from './dtos/approve-story.dto';
import {
  StoriesForApprovalListDTO,
  StoryWithApprovalLogsDTO,
} from './dtos/curator-story-approval.dto';

@Controller('curator')
export class CuratorStoryApprovalController {
  constructor(
    private readonly curatorStoryApprovalService: CuratorStoryApprovalService,
    private readonly curatorService: CuratorService,
  ) {}

  @Get('stories/waiting')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.CURATOR)
  public async getStoriesForApproval(): Promise<
    DataResponse<StoriesForApprovalListDTO>
  > {
    const storiesForApproval: StoriesForApprovalListDTO =
      await this.curatorStoryApprovalService.getStoriesForApproval();
    return new DataResponse<StoriesForApprovalListDTO>(
      HttpStatus.OK,
      'Berhasil mengambil daftar cerita yang menunggu persetujuan.',
      storiesForApproval,
    );
  }

  @Get('stories/:storyId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.CURATOR)
  public async getStoryDetail(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<DataResponse<StoryWithApprovalLogsDTO>> {
    const storyDetail: StoryWithApprovalLogsDTO =
      await this.curatorStoryApprovalService.getStoryDetail(storyId);
    return new DataResponse<StoryWithApprovalLogsDTO>(
      HttpStatus.OK,
      'Berhasil mengambil detail cerita.',
      storyDetail,
    );
  }

  @Post('stories/:storyId/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.CURATOR)
  public async approveOrRejectStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Body() approveStoryDTO: ApproveStoryDTO,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<StoryWithApprovalLogsDTO>> {
    const curator = await this.curatorService.findById(currentUser.id);

    if (!curator) {
      throw new NotFoundException('Kurator tidak ditemukan.');
    }

    const storyDetail: StoryWithApprovalLogsDTO =
      await this.curatorStoryApprovalService.approveOrRejectStory(
        storyId,
        approveStoryDTO,
        curator,
      );

    const statusMessage: string =
      approveStoryDTO.status === StoryStatus.ACCEPTED
        ? 'menyetujui'
        : 'menolak';

    return new DataResponse<StoryWithApprovalLogsDTO>(
      HttpStatus.OK,
      `Berhasil ${statusMessage} cerita.`,
      storyDetail,
    );
  }
}
