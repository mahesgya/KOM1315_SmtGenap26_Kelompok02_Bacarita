import { StoryStatus } from '../enum/story-status.enum';
import { Level } from './level.entity';
import { Story } from './story.entity';

describe('Unit Test: Level Entity', () => {
  it('must compute fullName correctly', () => {
    const level = new Level();
    level.no = 1;
    level.name = 'Introduction';
    expect(level.fullName).toBe('Level 1. Introduction');
  });

  it('must compute maxPoints based on accepted stories', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.REJECTED } as Story,
    ];
    expect(level.maxPoints).toBe(6); // 2 accepted stories * 3 points
  });

  it('must return 0 maxPoints if no accepted stories', () => {
    const level = new Level();
    level.stories = [{ status: StoryStatus.REJECTED } as Story];
    expect(level.maxPoints).toBe(0);
  });
});
