import { Level } from 'src/feature/levels/entities/level.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { DataSource, Repository } from 'typeorm';

export class LevelSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const levelRepo: Repository<Level> = manager.getRepository(Level);
      const storyRepo: Repository<Story> = manager.getRepository(Story);

      // ---------- LEVELS ----------
      const levelsData = [
        {
          no: 0,
          name: 'Pre-Test: Tes Kemampuan Awal',
          isBonusLevel: false,
          stories: [
            {
              title: 'Tes Kemampuan Membaca - Pre-Test',
              description:
                'Tes awal untuk mengetahui kemampuan membaca saat ini. Hasil tes akan membantu menentukan level yang tepat untuk memulai pembelajaran.',
              passage: `Selamat datang di Bacarita!\nKami ingin tahu kemampuanmu membaca.\nIni bukan ujian, jadi santai saja.\nBacalah cerita ini dengan hati-hati.\nLakukan yang terbaik.\nHasil tes ini akan membantu kami menemukan level yang cocok untukmu.\nSetelah selesai, kamu bisa langsung memulai petualangan belajar!\nSelamat mengerjakan!`,
              image: '/public/level/level0_story1.jpg',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 1,
          name: 'Dasar Vokal dan Konsonan',
          isBonusLevel: false,
          stories: [
            {
              title: 'Awal Petualangan Huruf',
              description:
                'Dasar Vokal dan Konsonan. Fokus A, I, U, M, K. Membangun dasar vokal dan konsonan yang bentuknya sangat berbeda.',
              passage: `M A U\nI M A\nM I U\nK A I\nU K I`,
              image: '/public/level/level1_story1.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Ada Apa Dibalik Bulat dan Garis',
              description:
                'Dasar Bentuk Huruf Konsonan. Fokus O, T, R, L. Memperkenalkan bentuk bulat (O) dan garis (T, R, L)',
              passage: `L A R O\nT O R U\nR O T A\nR O L U\nT R L A`,
              image: '/public/level/level1_story2.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'S untuk Semangat',
              description:
                'Huruf Konsonan. Fokus N, H, S, Z. n yang mirip u harus dipertegas dan dibedakan',
              passage: `N H S\nH S Z\nS H Z\nN S Z\nH N Z`,
              image: '/public/level/level1_story3.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Si Huruf B dan Si Huruf D',
              description: 'Huruf Reversal. Fokus B, D. Pasangan reversal',
              passage: `B A D I\nD A B U\nB I D A\nB U D A\nD I B A`,
              image: '/public/level/level1_story4.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Petualangan Huruf P, Q, V, dan Y',
              description: 'Fokus Huruf P, Q, V, Y',
              passage: `P I Q A\nV A P U\nY I P A\nP I V U\nQ I Y U`,
              image: '/public/level/level1_story5.png',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 2,
          name: 'Suku Kata Terbuka',
          isBonusLevel: false,
          stories: [
            {
              title: 'Suku Kata MA MI MU',
              description:
                'Suku Kata Konsonan Dasar. Fokus pada suku kata dengan konsonan yang sudah dikuasai',
              passage: `Ma Mi Mu\nI Ma Mu\nA Ma Mu`,
              image: '/public/level/level2_story1.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Latihan Membaca: Pa Pi Sa',
              description: 'Fokus ke huruf P dalam suku kata',
              passage: `Pa Pi Pu\nPo Pa Pu\nSa Pu Sa`,
              image: '/public/level/level2_story2.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Ayo Bedakan Ba-Da dan Bu-Du!',
              description:
                'Fokus membuat kontras perbedaan pada suku kata dengan huruf b/d.',
              passage: `Ba Di.\nDi Ba.\nBu Du.\nDu Bi\nBi Da`,
              image: '/public/level/level2_story3.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Suku Kata Seru untuk Pemula',
              description:
                'Menggabungkan suku kata berbeda yang tetap familiar untuk pemula.',
              passage: `Ta Ma\nMi Ti\nSu Ku\nMa Ta\nKu Su`,
              image: '/public/level/level2_story4.png',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Ayo Baca Suku Kata!',
              description:
                'Transisi suku kata yang membentuk kata bermakna sederhana.',
              passage: `Ra Sa.\nRo Ti.\nPa Ku.\nRa Tu\nKa Ta`,
              image: '/public/level/level2_story5.png',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 3,
          name: 'Kata Bermakna',
          isBonusLevel: false,
          stories: [
            {
              title: 'Mengenal Benda',
              description: 'Fokus ke 2 suku kata yang berpola KV-KV',
              passage: `Buku\nBola\nPaku\nKopi\nSapu`,
              image: '/public/level/level3_story1.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Hewan di Dunia',
              description: 'Fokus ke 2 suku kata yang berpola KV-KV',
              passage: `Sapi\nNaga\nKuda\nRusa\nTuna`,
              image: '/public/level/level3_story2.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Dunia Buah',
              description: 'Transisi ke kata dengan 3 suku kata KV-KV-KV',
              passage: `Kelapa\nPepaya\nSemangka\nAlpukat`,
              image: '/public/level/level3_story3.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Lingkungan Kelas',
              description: 'Pengenalan ke kata berakhiran konsonan',
              passage: `Pensil\nTas\nPulpen\nPapan\nMap`,
              image: '/public/level/level3_story4.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Perlengkapan Tidur',
              description:
                'Pengenalan kata berakhiran konsonan dalam konteks benda di kamar tidur.',
              passage: `Bantal\nGuling\nSelimut\nKasur\nLemari`,
              image: '/public/level/level3_story5.jpg',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 4,
          name: 'Kalimat Sederhana (S-P-O)',
          isBonusLevel: false,
          stories: [
            {
              title: 'Kegiatan di Rumah',
              description: 'Fokus ke kalimat inti aktif dan S-P',
              passage: `Ayah datang.\nNenek menjahit.\nIbu menyapu.\nKakak belajar.\nIbu menyapu.`,
              image: '/public/level/level4_story1.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Kegiatan di Sekolah',
              description: 'Fokus kalimat transitif dasar dan S-P-O.',
              passage: `Siswa membaca buku.\nGuru menulis materi.\nDika menghapus papan.\nRani menggambar bunga.\nEdo membawa tas.`,
              image: '/public/level/level4_story2.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Ada Apa di Hutan',
              description: 'Kalimat dengan keterangan atau S-P-K.',
              passage: `Harimau tidur di hutan.\nBurung terbang di atas pohon.\nMonyet bermain di dahan.\nUlar bersembunyi di semak.\nKelinci meloncat di rumput.`,
              image: '/public/level/level4_story3.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Taman Bermain',
              description: 'Kalimat lengkap dengan pola S-P-O-K.',
              passage: `Anak naik ayunan di taman.\nDika dorong mobilan di lapangan.\nRani ambil bola di perosotan.\nSisi bermain di halaman taman.\nEdo kejar kupu-kupu di taman.`,
              image: '/public/level/level4_story4.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Pantai yang Indah',
              description: 'Dua klausa sederhana dalam satu kalimat.',
              passage: `Saya berjalan dan melihat laut.\nKakak berlari dan bermain pasir.\nAdik menggali dan membuat istana.\nAyah duduk dan menikmati angin.\nIbu tersenyum dan memotret pemandangan.`,
              image: '/public/level/level4_story5.jpg',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 5,
          name: 'Cerita Naratif Sederhana',
          isBonusLevel: false,
          stories: [
            {
              title: 'Kucing Putih yang Lucu',
              description: 'Semua kalimat S-P/S-P-O sederhana.',
              passage:
                'Kucing saya berwarna putih. Kucing itu punya bulu lembut. Saya memanggil kucing itu Lili. Lili suka minum susu. Lili juga tidur di sofa. Saya sering mengajak Lili bermain. Kucing putih itu selalu membuat saya senang.',
              image: '/public/level/level5_story1.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Kegiatan Pagi Hari Budi',
              description: 'Urutan kronologis.',
              passage:
                'Pagi itu Budi bangun dari tidur. Budi merapikan tempat tidur. Budi pergi ke kamar mandi. Budi mencuci muka. Budi sarapan bersama ibu. Budi memakai tas sekolah. Budi berangkat ke sekolah dengan senang.',
              image: '/public/level/level5_story2.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Hari Seru Dedi di Sekolah',
              description:
                'Memperkuat pola S-P-O Level 4 dalam konteks naratif.',
              passage:
                'Dedi senang pergi ke sekolah. Dedi bertemu teman baru. Dedi membawa buku cerita. Mereka membaca satu buku. Mereka memainkan bola di halaman. Dedi membantu temannya bermain. Dedi menikmati hari di sekolah.',
              image: '/public/level/level5_story3.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Kancil di Tepi Sungai',
              description: 'Penggunaan keterangan.',
              passage:
                'Di tepi sungai berjalan seekor kancil kecil. Kancil itu mencari makanan di antara semak. Ia melihat buah merah dan memakannya dengan lahap. Air sungai mengalir tenang di dekat kakinya. Beberapa burung terbang di atas kepalanya. Kancil itu bermain air sebentar. Setelah itu kancil pulang ke hutan dengan gembira.',
              image: '/public/level/level5_story4.jpg',
              status: StoryStatus.ACCEPTED,
            },
            {
              title: 'Kelinci dan Kura-Kura Berlari',
              description: 'Menggabungkan S-P dan S-P-K.',
              passage:
                'Kelinci berlari cepat. Kura-kura berjalan pelan di tepi jalan. Kelinci terus berlari di bawah matahari. Kura-kura maju perlahan tetapi tidak berhenti. Kelinci merasa lelah lalu duduk di bawah pohon. Sementara itu kura-kura terus bergerak. Akhirnya kura-kura sampai lebih dulu di garis akhir.',
              image: '/public/level/level5_story5.jpg',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
        {
          no: 9999,
          name: 'Post-Test: Tes Kemampuan Akhir',
          isBonusLevel: false,
          stories: [
            {
              title: 'Tes Kemampuan Membaca - Post-Test',
              description:
                'Tes akhir untuk mengetahui perkembangan kemampuan membaca setelah menyelesaikan level pembelajaran.',
              passage: `Selamat datang di Post-Test Bacarita!\nIni adalah tes akhir untuk melihat sejauh mana kemampuanmu berkembang.\nIni bukan ujian, jadi santai saja.\nBacalah cerita ini dengan hati-hati.\nLakukan yang terbaik.\nSetelah selesai, kamu akan melihat progres belajarmu.\nSelamat mengerjakan!`,
              image: '/public/level/level0_story1.jpg',
              status: StoryStatus.ACCEPTED,
            },
          ],
        },
      ];

      for (const levelData of levelsData) {
        let level = await levelRepo.findOne({ where: { no: levelData.no } });

        if (level) {
          await levelRepo.update(
            { no: levelData.no },
            {
              name: levelData.name,
              isBonusLevel: levelData.isBonusLevel,
            },
          );
          level = await levelRepo.findOneByOrFail({ no: levelData.no });
        } else {
          level = levelRepo.create({
            no: levelData.no,
            name: levelData.name,
            isBonusLevel: levelData.isBonusLevel,
          });
          await levelRepo.save(level);
        }

        // ---------- STORIES FOR THIS LEVEL ----------
        // Get existing stories for this level
        const existingStories = await storyRepo.find({
          where: { level: { id: level.id } },
        });

        // Update or create stories based on index position
        for (let i = 0; i < levelData.stories.length; i++) {
          const storyData = levelData.stories[i];
          const existingStory = existingStories[i];

          if (existingStory) {
            // Update existing story at this position
            await storyRepo.update(
              { id: existingStory.id },
              { ...storyData, level },
            );
          } else {
            // Create new story if it doesn't exist
            const newStory = storyRepo.create({ ...storyData, level });
            await storyRepo.save(newStory);
          }
        }

        // Remove extra stories if the seed data has fewer stories than before
        if (existingStories.length > levelData.stories.length) {
          for (
            let i = levelData.stories.length;
            i < existingStories.length;
            i++
          ) {
            await storyRepo.remove(existingStories[i]);
          }
        }
      }
    });
  }
}
