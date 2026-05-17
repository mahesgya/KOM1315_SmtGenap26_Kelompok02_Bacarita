import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { STTWordResult } from './stt-word-result.entity';
import { TestSession } from './test-session.entity';

describe('Unit Test: TestSession Entity', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    process.env.APP_URL = 'http://localhost:3000';
  });

  it('must set fields correctly', () => {
    const testSession = new TestSession();
    testSession.id = 'test-1';
    testSession.titleAtTaken = 'Test Story';
    testSession.passageAtTaken = 'Test passage\ntest Passage2';

    expect(testSession.id).toBe('test-1');
    expect(testSession.titleAtTaken).toBe('Test Story');
    expect(testSession.passageAtTaken).toBe('Test passage\ntest Passage2');
  });

  it('must compute imageAtTakenUrl correctly when image exists', () => {
    const testSession = new TestSession();
    testSession.imageAtTaken = '/public/images/story-1.jpg';
    expect(testSession.imageAtTakenUrl).toBe(
      'http://localhost:3000/public/images/story-1.jpg',
    );
  });

  it('must return null for imageAtTakenUrl when no image', () => {
    const testSession = new TestSession();
    expect(testSession.imageAtTakenUrl).toBeNull();
  });

  it('must compute remainingTimeInSeconds correctly for active session', () => {
    const testSession = new TestSession();
    const now = new Date();
    testSession.startedAt = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 minutes ago

    const remainingTime = testSession.remainingTimeInSeconds;
    expect(remainingTime).toBeGreaterThan(5300);
    expect(remainingTime).toBeLessThan(5401);
  });

  it('must return 0 remainingTimeInSeconds for finished session', () => {
    const testSession = new TestSession();
    testSession.startedAt = new Date('2025-01-01');
    testSession.finishedAt = new Date('2025-01-01');
    expect(testSession.remainingTimeInSeconds).toBe(0);
  });

  it('must return 0 remainingTimeInSeconds when time exceeded', () => {
    const testSession = new TestSession();
    testSession.startedAt = new Date('2025-01-01'); // Way past the 120 minutes limit
    expect(testSession.remainingTimeInSeconds).toBe(0);
  });

  it('must handle score and medal calculation right', () => {
    const testSession: TestSession = new TestSession();
    const sttWordResult: STTWordResult[] = [
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: 60,
      } as STTWordResult,
      {
        id: 'stt-2',
        testSession: testSession,
        accuracy: 64,
      } as STTWordResult,
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: 100,
      } as STTWordResult,
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: null as unknown,
      } as STTWordResult,
    ];

    testSession.score = testSession.calculateScore(sttWordResult);
    expect(testSession.score).toBe(224 / 4);
    testSession.medal = testSession.determineMedal();
    expect(testSession.medal).toBe(StoryMedal.SILVER);

    const testSession2: TestSession = new TestSession();
    const sttWordResult2: STTWordResult[] = [
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: 60,
      } as STTWordResult,
      {
        id: 'stt-2',
        testSession: testSession,
        accuracy: 64,
      } as STTWordResult,
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: 100,
      } as STTWordResult,
      {
        id: 'stt-1',
        testSession: testSession,
        accuracy: 100,
      } as STTWordResult,
    ];

    testSession2.score = testSession2.calculateScore(sttWordResult2);
    expect(testSession2.score).toBe(81);
    testSession2.medal = testSession2.determineMedal();
    expect(testSession2.medal).toBe(StoryMedal.GOLD);
  });

  it('must handle score and medal calculation right if no stt', () => {
    const testSession: TestSession = new TestSession();
    const sttWordResult: STTWordResult[] = [];

    testSession.score = testSession.calculateScore(sttWordResult);
    expect(testSession.score).toBe(0);
    testSession.medal = testSession.determineMedal();
    expect(testSession.medal).toBe(StoryMedal.BRONZE);
  });
});
