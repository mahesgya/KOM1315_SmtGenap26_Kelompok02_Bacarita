/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { STTWordResult } from './stt-word-result.entity';
import { TestSession } from './test-session.entity';

describe('Unit Test: STTWordResult Entity', () => {
  it('must set fields correctly', () => {
    const sttWordResult = new STTWordResult();
    sttWordResult.id = 'stt-1';
    sttWordResult.expectedWord = 'hello';
    sttWordResult.instruction = 'Say the word "hello"';

    expect(sttWordResult.id).toBe('stt-1');
    expect(sttWordResult.expectedWord).toBe('hello');
    expect(sttWordResult.instruction).toBe('Say the word "hello"');
  });

  describe('canBeAnswered()', () => {
    it('must return true when both spokenWord and accuracy are null', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      (sttWordResult as any).spokenWord = null;
      (sttWordResult as any).accuracy = null;

      expect(sttWordResult.canBeAnswered()).toBe(true);
    });

    it('must return true when spokenWord is null and accuracy has value', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      (sttWordResult as any).spokenWord = null;
      sttWordResult.accuracy = 85.5;

      expect(sttWordResult.canBeAnswered()).toBe(true);
    });

    it('must return true when spokenWord has value and accuracy is null', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      sttWordResult.spokenWord = 'hello';
      (sttWordResult as any).accuracy = null;

      expect(sttWordResult.canBeAnswered()).toBe(true);
    });

    it('must return true when both fields are undefined', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      // spokenWord and accuracy are undefined by default

      expect(sttWordResult.canBeAnswered()).toBe(true);
    });

    it('must return false when both spokenWord and accuracy have values (already answered)', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      sttWordResult.spokenWord = 'hello';
      sttWordResult.accuracy = 85.5;

      expect(sttWordResult.canBeAnswered()).toBe(false);
    });

    it('must return false when answer is complete with different spoken word', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      sttWordResult.spokenWord = 'helo'; // Misspelled
      sttWordResult.accuracy = 60.0;

      expect(sttWordResult.canBeAnswered()).toBe(false);
    });

    it('must return false when answer has zero accuracy', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      sttWordResult.spokenWord = 'world';
      sttWordResult.accuracy = 0;

      expect(sttWordResult.canBeAnswered()).toBe(false);
    });

    it('must return false when answer has perfect accuracy', () => {
      const sttWordResult = new STTWordResult();
      sttWordResult.expectedWord = 'hello';
      sttWordResult.spokenWord = 'hello';
      sttWordResult.accuracy = 100;

      expect(sttWordResult.canBeAnswered()).toBe(false);
    });
  });

  it('must associate with TestSession correctly', () => {
    const testSession = new TestSession();
    testSession.id = 'test-1';

    const sttWordResult = new STTWordResult();
    sttWordResult.id = 'stt-1';
    sttWordResult.testSession = testSession;
    sttWordResult.expectedWord = 'hello';

    expect(sttWordResult.testSession).toBe(testSession);
    expect(sttWordResult.testSession.id).toBe('test-1');
  });
});
