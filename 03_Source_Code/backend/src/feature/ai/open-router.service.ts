import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';

@Injectable()
export class OpenRouterService {
  private readonly client: OpenAI;
  private readonly clientModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenRouterService.name);
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('app.ai.openRouterApiKey'),
      baseURL: this.configService.get<string>('app.ai.openRouterBaseUrl'),
    });
    this.clientModel = this.configService.get<string>(
      'app.ai.openRouterModel',
    )!;
  }

  public async generateQuestionsForPreTest(): Promise<string[]> {
    const prompt: string = `
      You are a children's dyslexia language therapist and reading specialist.

      Goal:
      Create a **Pretest Reading Task** to evaluate a student's current reading ability before assigning them a level (Level 1–5).
      The students is in early elementary grades (ages 6–12) and may have dyslexia.

      The pretest should sample skills from all levels:
      - Level 1: Letter discrimination (visual reversal and phoneme pairing)
      - Level 2: Open syllable patterns (KV)
      - Level 3: Simple two-syllable words
      - Level 4: Basic sentences (S-P, S-P-O)
      - Level 5: Simple narrative sentences (chronological or descriptive)

      Guidelines:
      - Language: Indonesian
      - Each prompt should be short and phonetically simple
      - No punctuation, no complex words
      - Prefer real or high-frequency words
      - Total 15 items across 5 difficulty tiers
        - 3 items from each level's skill set
      - Each must be **5 words or fewer**
      - Each must be **phonetically simple and rhythmically clear**
      - Prefer **high-frequency or early-reading words** (e.g., “Rafi pakai sepatu hujan”)
      - Avoid abstract or compound sentences
      - Avoid punctuation and special characters
      - Avoid vulgar, sensitive, or culturally inappropriate content
      - Include a mix of:
        - **Whole-word repetition prompts** (for sight word recall)
        - **Short phrase reconstruction** (for context recall)
        - **Sound-pattern reinforcement** (for phonological awareness)

      Expected Output:
      Return ONLY a **JSON array of strings** with no extra explanation or formatting.

      Example Output:
      [ "b d p q", "ma ki ku", "pa pi pu", "mama", "buku", "Ibu masak", "Budi tendang bola", "Ibu pergi ke pasar"]
      `;

    try {
      const completion: OpenAI.Chat.ChatCompletion =
        await this.client.chat.completions.create({
          model: this.clientModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        });

      const content: string =
        completion.choices[0].message
          ?.content!.replace(/```json/g, '')
          .replace(/```/g, '')
          .trim() ?? '[]';

      const parsed: string[] = JSON.parse(content) as string[];
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === 'string')
      ) {
        return parsed;
      }

      throw new InternalServerErrorException(
        'Gagal menghasilkan pertanyaan, silahkan coba lagi. (OpenRouter Error)',
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Gagal menghasilkan pertanyaan, silahkan coba lagi.',
      );
    }
  }

  public async generateQuestionsFromStoryPassage(
    passage: string,
  ): Promise<string[]> {
    const prompt: string = `
      You are a children's dyslexia language therapist and reading specialist.

      Your goal is to help a dyslexic student improve:
      1. Reading clarity (fluency and pacing)
      2. Word recognition (decoding and sight-word familiarity)
      3. Alphabet recognition (letter-to-sound awareness)

      You will be given a short story passage.
      From it, generate 4 short reading prompts that are directly based on the story.

      Guidelines for your prompts:
      - Language: Indonesian
      - If the passage is just a alphabet or letter sequence, create prompts focused on letter recognition and phoneme pairing.
      - Each prompt must be a **factual phrase** from the story (no imagination or added detail)
      - Each must be **5 words or fewer**
      - Each must be **phonetically simple and rhythmically clear**
      - Prefer **high-frequency or early-reading words** (e.g., “Rafi pakai sepatu hujan”)
      - Avoid abstract or compound sentences
      - Avoid new vocabulary not present in the story
      - Avoid punctuation and special characters
      - Avoid vulgar, sensitive, or culturally inappropriate content
      - Include a mix of:
        - **Whole-word repetition prompts** (for sight word recall)
        - **Short phrase reconstruction** (for context recall)
        - **Sound-pattern reinforcement** (for phonological awareness)

      Return ONLY a **JSON array of strings** with no extra explanation or formatting.

      Example Output:
      ["Rafi pakai sepatu", "Tanah penuh lumpur", "Rafi tertawa gembira", "Sepatu hujan kuat"]

      Story Passage:
      ${passage}
    `;

    try {
      const completion: OpenAI.Chat.ChatCompletion =
        await this.client.chat.completions.create({
          model: this.clientModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        });

      const content: string =
        completion.choices[0].message
          ?.content!.replace(/```json/g, '')
          .replace(/```/g, '')
          .trim() ?? '[]';

      const parsed: string[] = JSON.parse(content) as string[];
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === 'string')
      ) {
        return parsed;
      }

      throw new InternalServerErrorException(
        'Gagal menghasilkan pertanyaan, silahkan coba lagi. (OpenRouter Error)',
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Gagal menghasilkan pertanyaan, silahkan coba lagi.',
      );
    }
  }
}
