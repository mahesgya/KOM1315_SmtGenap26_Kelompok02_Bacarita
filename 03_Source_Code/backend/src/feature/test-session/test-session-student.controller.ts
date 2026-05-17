import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthRole } from '../auth/enums/auth.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ICurrentUser } from '../auth/interfaces/current-user.interfaces';
import { AnswerSTTQuestionDTO } from './dtos/answer-stt-question.dto';
import { CreateDistractionEventDTO } from './dtos/create-distraction-event.dto';
import { CreateDistractionSummaryDTO } from './dtos/create-distraction-summary.dto';
import { DistractionEventResponseDTO } from './dtos/distraction-event-response.dto';
import { DistractionSummaryResponseDTO } from './dtos/distraction-summary-response.dto';
import { StartNewTestSessionDTO } from './dtos/start-new-test-session.dto';
import { STTAnsweredQuestionDTO } from './dtos/stt-answered-question.dto';
import { STTQuestionResponseDTO } from './dtos/stt-question-response.dto';
import { TestSessionResponseDTO } from './dtos/test-session-response.dto';
import { TestSessionService } from './test-session.service';

@Controller('students/test-sessions')
export class StudentTestSessionController {
  constructor(private readonly testSessionService: TestSessionService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  public async startNewTestSession(
    @Body() newTestSession: StartNewTestSessionDTO,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<TestSessionResponseDTO>> {
    const newlyCreatedTestSession: TestSessionResponseDTO =
      await this.testSessionService.startNewTestSession(
        currentUser.id,
        newTestSession.storyId,
      );

    return new DataResponse<TestSessionResponseDTO>(
      HttpStatus.CREATED,
      `Berhasil memulai sesi tes baru untuk murid ${currentUser.username}, cerita (story) ID ${newTestSession.storyId}, sesi tes ID ${newlyCreatedTestSession.id}`,
      newlyCreatedTestSession,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async getTestSessionById(
    @Param('id') testSessionId: string,
    @CurrentUser()
    currentUser: ICurrentUser,
  ): Promise<DataResponse<TestSessionResponseDTO>> {
    const testSession: TestSessionResponseDTO =
      await this.testSessionService.getTestSessionByIdForStudent(
        testSessionId,
        currentUser.id,
      );

    return new DataResponse<TestSessionResponseDTO>(
      HttpStatus.OK,
      `Status test session dengan ID ${testSessionId} valid`,
      testSession,
    );
  }

  @Get(':id/status')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async getTestSessionStatus(
    @Param('id') testSessionId: string,
    @CurrentUser()
    currentUser: ICurrentUser,
  ): Promise<DataResponse<TestSessionResponseDTO>> {
    const testSession: TestSessionResponseDTO =
      await this.testSessionService.getTestSessionStatus(
        testSessionId,
        currentUser.id,
      );

    return new DataResponse<TestSessionResponseDTO>(
      HttpStatus.OK,
      `Status test session dengan ID ${testSessionId} valid`,
      testSession,
    );
  }

  @Post(':id/stt-questions/:sttId/answer')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async answerSTTQuestionSession(
    @Param('id') testSessionId: string,
    @Param('sttId') sttQuestionId: string,
    @Body() answerSTTQuestionDTO: AnswerSTTQuestionDTO,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<STTAnsweredQuestionDTO>> {
    const sttQuestions: STTAnsweredQuestionDTO =
      await this.testSessionService.answerSTTQuestionSession(
        testSessionId,
        sttQuestionId,
        currentUser.id,
        answerSTTQuestionDTO,
      );

    return new DataResponse<STTAnsweredQuestionDTO>(
      HttpStatus.CREATED,
      `Berhasil menjawab pertanyaan STT dengan ID ${sttQuestionId} pada sesi tes dengan ID ${testSessionId}`,
      sttQuestions,
    );
  }

  @Post(':id/stt-questions')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  public async startSTTQuestionSession(
    @Param('id') testSessionId: string,
    @CurrentUser()
    currentUser: ICurrentUser,
  ): Promise<DataResponse<STTQuestionResponseDTO[]>> {
    const sttQuestions: STTQuestionResponseDTO[] =
      await this.testSessionService.startSTTQuestionSession(
        testSessionId,
        currentUser.id,
      );

    return new DataResponse<STTQuestionResponseDTO[]>(
      HttpStatus.CREATED,
      `Sesi pertanyaan STT untuk sesi tes dengan ID ${testSessionId} berhasil dimulai`,
      sttQuestions,
    );
  }

  @Post(':id/finish')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async finishTestSession(
    @Param('id') testSessionId: string,
    @CurrentUser()
    currentUser: ICurrentUser,
  ): Promise<DataResponse<TestSessionResponseDTO>> {
    const finishedTestSession: TestSessionResponseDTO =
      await this.testSessionService.finishTestSession(
        testSessionId,
        currentUser.id,
      );

    return new DataResponse<TestSessionResponseDTO>(
      HttpStatus.OK,
      `Sesi tes dengan ID ${testSessionId} berhasil diselesaikan`,
      finishedTestSession,
    );
  }

  @Post(':id/distraction')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  public async createDistractionEvent(
    @Param('id') testSessionId: string,
    @Body() createDistractionEventDTO: CreateDistractionEventDTO,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<DistractionEventResponseDTO>> {
    const distractionEvent: DistractionEventResponseDTO =
      await this.testSessionService.createDistractionEvent(
        testSessionId,
        currentUser.id,
        createDistractionEventDTO,
      );

    return new DataResponse<DistractionEventResponseDTO>(
      HttpStatus.CREATED,
      `Berhasil mencatat DistractionEyeEvent pada sesi tes dengan ID ${testSessionId}`,
      distractionEvent,
    );
  }

  @Post(':id/distraction/summary')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  public async createDistractionSummary(
    @Param('id') testSessionId: string,
    @Body() createDistractionSummaryDTO: CreateDistractionSummaryDTO,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<DistractionSummaryResponseDTO>> {
    const distractionSummary: DistractionSummaryResponseDTO =
      await this.testSessionService.createDistractionSummary(
        testSessionId,
        currentUser.id,
        createDistractionSummaryDTO,
      );

    return new DataResponse<DistractionSummaryResponseDTO>(
      HttpStatus.CREATED,
      `Berhasil membuat ringkasan DistractionEyeEventSummary untuk sesi tes dengan ID ${testSessionId}`,
      distractionSummary,
    );
  }
}
