import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { Student } from 'src/feature/users/entities/student.entity';
import { Level } from './level.entity';
import { LevelProgress } from './level-progress.entity';

describe('Unit Test: Story Entity', () => {
  it('must create a story with default status', () => {
    const story = new Story();
    expect(story.status).toBe(StoryStatus.WAITING_NEWLY);
  });

  it('must set fields correctly', () => {
    const story = new Story();
    story.title = 'Test Story';
    story.passage = 'Test passage';
    story.status = StoryStatus.ACCEPTED;
    expect(story.title).toBe('Test Story');
    expect(story.passage).toBe('Test passage');
    expect(story.status).toBe(StoryStatus.ACCEPTED);
  });

  it('must split passage to sentences correctly', () => {
    const story = new Story();
    story.passage =
      'Test passage\nThis is second sentence! And the third one?. \nFourth sentence.\nfifth sentence';
    expect(story.passageSentences).toEqual([
      'Test passage',
      'This is second sentence! And the third one?',
      'Fourth sentence',
      'fifth sentence',
    ]);
  });

  it('(static passageToSenteces) must split passage to sentences correctly', () => {
    const passage: string =
      'Test passage\nThis is second sentence! And the third one?. \nFourth sentence.\nfifth sentence';
    expect(Story.passageToSentences(passage)).toEqual([
      'Test passage',
      'This is second sentence! And the third one?',
      'Fourth sentence',
      'fifth sentence',
    ]);
  });

  it('(isCurrentStudentValidForStory) must handle correctly', () => {
    const student: Student = new Student();
    student.id = 'student-1';

    const level1: Level = new Level();
    const level2: Level = new Level();
    const levelProgress1 = new LevelProgress();
    levelProgress1.student = student;
    levelProgress1.level = level1;
    levelProgress1.isUnlocked = true;

    const levelProgress2 = new LevelProgress();
    levelProgress2.student = student;
    levelProgress2.level = level2;
    levelProgress2.isUnlocked = false;

    const story1: Story = new Story();
    story1.level = level1;
    level1.levelProgresses = [levelProgress1];
    const story2: Story = new Story();
    story2.level = level2;
    level2.levelProgresses = [levelProgress2];

    expect(story1.isCurrentStudentValidForStory('student-1')).toBe(true);
    expect(story2.isCurrentStudentValidForStory('student-1')).toBe(false);
  });
});
