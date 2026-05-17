import { LevelProgress } from 'src/feature/levels/entities/level-progress.entity';
import { Level } from 'src/feature/levels/entities/level.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';

describe('Unit Test: LevelProgress Entity', () => {
  it('must compute currentPoints correctly', () => {
    const progress = new LevelProgress();
    progress.goldCount = 1; // 3 points
    progress.silverCount = 2; // 2 points each = 4
    progress.bronzeCount = 1; // 1 point
    expect(progress.currentPoints).toBe(8); // 3 + 4 + 1
  });

  it('must compute progress as percentage', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
    ]; // maxPoints = 6
    const progress = new LevelProgress();
    progress.level = level;
    progress.goldCount = 1; // currentPoints = 3
    expect(progress.progress).toBe(50); // ceil(3 / 6 * 100)
  });

  it('must compute requiredPoints to reach 75% threshold', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
    ]; // maxPoints = 6, target = 4.5 -> 5
    const progress = new LevelProgress();
    progress.level = level;
    progress.goldCount = 1; // currentPoints = 3
    expect(progress.requiredPoints).toBe(2); // 5 - 3
  });

  it('must return 0 requiredPoints if already at or above threshold', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
    ]; // maxPoints = 6, target = 4.5 -> 5
    const progress = new LevelProgress();
    progress.level = level;
    progress.goldCount = 2; // currentPoints = 6
    expect(progress.requiredPoints).toBe(0);
  });

  it('must return 0 requiredPoints; 100 progress if already completed', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
    ]; // maxPoints = 6, target = 4.5 -> 5
    const progress = new LevelProgress();
    progress.level = level;
    progress.isCompleted = true;
    expect(progress.progress).toBe(100);
    expect(progress.requiredPoints).toBe(0);
    expect(progress.isSkipped).toBe(false);
  });

  it('must return 0 requiredPoints; 100 progress; and isSkipped true if skipped', () => {
    const level = new Level();
    level.stories = [
      { status: StoryStatus.ACCEPTED } as Story,
      { status: StoryStatus.ACCEPTED } as Story,
    ]; // maxPoints = 6, target = 4.5 -> 5
    const progress = new LevelProgress();
    progress.level = level;
    progress.isCompleted = true;
    progress.isSkipped = true;
    expect(progress.progress).toBe(100);
    expect(progress.requiredPoints).toBe(0);
    expect(progress.isSkipped).toBe(true);
  });
});
