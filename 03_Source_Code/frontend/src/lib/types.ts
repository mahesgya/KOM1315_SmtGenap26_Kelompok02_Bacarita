export type Story = { id: number; title: string; description: string; image: string; goldMedal: boolean; silverMedal: boolean; bronzeMedal: boolean };
export type PerStoryStat = { storyId: number; distraction: number; medals: { gold: boolean; silver: boolean; bronze: boolean } };
export type ChildProgress = { id: number; name: string; stats: PerStoryStat[] };
