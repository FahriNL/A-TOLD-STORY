export default {
  meta: { title: 'A Told Story', accentColor: '#e8a027' },
  characters: {
    rowan: { name: 'Rowan', color: '#e8a027' },
    ayah: { name: 'Ayah', color: '#8ca384' },
    garon: { name: 'Garon', color: '#d65151' },
    elara: { name: 'Elara', color: '#4a90a4' },
    finn: { name: 'Finn', color: '#8f9076' },
    bram: { name: 'Bram', color: '#6b5a75' },
    rufus: { name: 'Rufus', color: '#e03f3f' },
    silas: { name: 'Silas', color: '#e5dfd3' },
    petualang: { name: 'Petualang', color: '#a8a8a8' },
    lian: { name: 'Lian', color: '#aaaaaa' }
  },
  scenes: {
    // ==========================================
    // EPISODE 1
    // ==========================================
    intro: {
      background: { type: 'css', preset: 'forest' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Episode 1: Pedang Tumpul dan Lidah Tajam' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Depan Dungeon Akar Berdarah - Siang.' },
        { type: 'dialogue', speaker: 'BRAM', portrait: 'left', text: 'Akar-akar itu tak hanya menghisap air, Nak. Mereka meminum darah mereka yang ceroboh.' },
        { type: 'dialogue', speaker: 'GARON', portrait: 'right', text: 'Simpan dongeng menakut-nakutimu! Monster akar? Bakal kujadikan kayu bakar!' },
        {
          type: 'choice',
          id: 'bram_interact',
          options: [
            { 
              text: 'Lempar koin padanya', 
              requires: null, 
              effects: [{ type: 'log', text: 'Kamu meremehkan sang pendongeng dengan koin receh.' }], 
              goto: 'dungeon_entry_arrogant' 
            },
            { 
              text: 'Dengarkan peringatannya baik-baik', 
              requires: null, 
              effects: [
                { type: 'log', text: 'Kamu menghargai ramalan orang tua itu.' },
                { type: 'relation', char: 'bram', stat: 'trust', delta: 10 }
              ], 
              goto: 'dungeon_entry_polite' 
            }
          ]
        }
      ]
    },

    dungeon_entry_arrogant: {
      background: { type: 'css', preset: 'corridor' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Anggap saja itu bayaran hiburannya, Kek. Ayo masuk, teman-teman.' },
        { type: 'goto', scene: 'dungeon_interior', transition: 'fade' }
      ]
    },

    dungeon_entry_polite: {
      background: { type: 'css', preset: 'corridor' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Apa kau punya saran lain, Kek?' },
        { type: 'dialogue', speaker: 'BRAM', portrait: 'right', text: 'Mata mereka buta cahaya. Hindari lumpur merah.' },
        { type: 'memory', text: 'Peringatan telah dicatat.', icon: '📜' },
        { type: 'flag', key: 'knows_weakness', value: true },
        { type: 'goto', scene: 'dungeon_interior', transition: 'fade' }
      ]
    },

    dungeon_interior: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'SFX: Suara daging terkoyak.' },
        { type: 'dialogue', speaker: 'ELARA', portrait: 'right', text: 'Mantraku tidak tembus! Kulit mereka terlalu tebal!' },
        { type: 'dialogue', speaker: 'GARON', portrait: 'left', text: 'AAARRRGGGHHH!!!' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Garon tertusuk sulur besar di bagian perut!' },
        {
          type: 'choice',
          id: 'save_garon',
          timed: true,
          duration: 6,
          default: 1,
          options: [
            {
              text: 'Tebas akar itu!',
              requires: null,
              effects: [
                { type: 'log', text: 'Kamu mempertaruhkan nyawamu untuk menyelamatkan Garon.' },
                { type: 'relation', char: 'garon', stat: 'trust', delta: 20 },
                { type: 'memory', text: 'Keberanian yang bodoh.', icon: '⚔️' }
              ],
              goto: 'dungeon_qte'
            },
            {
              text: 'Mundur! Tinggalkan!',
              requires: null,
              effects: [
                { type: 'log', text: 'Kamu lebih memilih keselamatan diri dan lari membiarkan Garon disayat.' },
                { type: 'relation', char: 'elara', stat: 'trust', delta: 10 }
              ],
              goto: 'dungeon_escape_coward'
            }
          ]
        }
      ]
    },

    dungeon_qte: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Hiyaaaa!!! Lepaskan dia!' },
        {
          type: 'qte', mode: 'press', duration: 4, instruction: 'TEBAS',
          onSuccess: { goto: 'dungeon_escape_hero' },
          onFail: { goto: 'dungeon_escape_coward' }
        }
      ]
    },

    dungeon_escape_hero: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Pedangmu memantul keras, menyisakan luka kecil di akar itu. Tanganmu mati rasa.' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Sial, ini terlalu tumpul! Tapi aku ada kesempatan!' },
        {
          type: 'choice',
          id: 'use_weakness',
          options: [
            { 
              text: 'Siram akar dengan obor (Saran Bram)', 
              requires: { flag: 'knows_weakness', is: true }, 
              effects: [
                { type: 'log', text: 'Kamu membakar akar itu berkat informasi sang kakek tua.' },
                { type: 'item_add', item: 'akar_berdarah' },
                { type: 'memory', text: 'Mendapat [Akar Kering].', icon: '🎒' }
              ], 
              goto: 'dungeon_run' 
            },
            { 
              text: 'Tarik Garon keluar dengan paksa', 
              requires: null, 
              effects: [{ type: 'log', text: 'Garon terluka parah namun kau berhasil menariknya keluar.' }], 
              goto: 'dungeon_run' 
            }
          ]
        }
      ]
    },

    dungeon_escape_coward: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Sial... sial! Tarik dia! Kita mundur! MUNDUR!!' },
        { type: 'goto', scene: 'dungeon_run' }
      ]
    },

    dungeon_run: {
      background: { type: 'css', preset: 'corridor' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Kalian berhasil keluar bergulingan ke luar gua.' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Rowan menatap pedangnya yang tumpul.' },
        { type: 'goto', scene: 'ladang_gandum', transition: 'fade' }
      ]
    },

    ladang_gandum: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Beberapa hari kemudian di ladang.' },
        { type: 'dialogue', speaker: 'AYAH', portrait: 'right', text: 'Menjadi petani juga hal mulia. Setidaknya, kau masih hidup.' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: '(Gumam) Ya... setidaknya aku masih hidup.' },
        { type: 'goto', scene: 'alun_alun' }
      ]
    },

    alun_alun: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Di alun-alun, Rowan melihat Bram sang Storyteller mendapat lemparan perak hanya dengan bercerita.' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: '(Dalam hati) Ini keahlian. Dia menjual keberanian dan rasa takut.' },
        { type: 'goto', scene: 'kedai_murah' }
      ]
    },

    kedai_murah: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Aku akan menjadi Storyteller.' },
        { type: 'dialogue', speaker: 'FINN', portrait: 'right', text: 'Kau? Astaga, perutku sakit!' },
        { type: 'dialogue', speaker: 'ELARA', portrait: 'right', text: 'Kau tidak bisa mengayunkan pedang tanpa gemetar. Siapa yang mau dengar anak desa sepertimu?' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Justru karena aku pengecut... aku tahu rasa takutnya. Petualang butuh kebenaran.' },
        { type: 'episode_review' },
        { type: 'goto', scene: 'episode2_start', transition: 'fade' }
      ]
    },

    // ==========================================
    // EPISODE 2
    // ==========================================
    episode2_start: {
      background: { type: 'css', preset: 'corridor' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Episode 2: Harga Sebuah Kata' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: '...membawa tidak hanya harta, tapi juga nyawa yang utuh!' },
        { type: 'dialogue', speaker: 'PETUALANG', portrait: 'right', text: 'Hanya ini? Kami butuh letak monster, bukan metafora.' },
        {
          type: 'choice',
          id: 'ep2_sell_info',
          options: [
            { 
              text: 'Biarkan mereka pergi', 
              requires: null, 
              effects: [{ type: 'log', text: 'Gagal mendapatkan koin karena ceritamu tidak berguna.' }], 
              goto: 'rufus_intro' 
            },
            { 
              text: 'Berikan informasi Akar Berdarah', 
              requires: { item: 'akar_berdarah' }, 
              effects: [
                { type: 'log', text: 'Kamu menjual rahasia kelemahan akar berdarah demi satu keping perak.' },
                { type: 'item_remove', item: 'akar_berdarah' },
                { type: 'memory', text: 'Mendapat uang! (Akar hilang)', icon: '💰' }
              ], 
              goto: 'rufus_intro' 
            }
          ]
        }
      ]
    },

    rufus_intro: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Keesokan harinya, Rufus sang Storyteller Elit muncul dan merebut penonton Rowan.' },
        { type: 'dialogue', speaker: 'RUFUS', portrait: 'right', text: 'Jalanan ini memang milik umum. Tapi Area Selatan ini wilayahku. Pergi dari sini anak petani.' },
        { type: 'goto', scene: 'rufus_beatup', transition: 'cut' }
      ]
    },

    rufus_beatup: {
      background: { type: 'css', preset: 'forest' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Rufus dan dua preman mencegatmu di depan dungeon kabut.' },
        { type: 'dialogue', speaker: 'RUFUS', portrait: 'right', text: 'Kau merusak harga pasar! Ceritamu sampah!' },
        {
          type: 'qte', mode: 'mash', duration: 4, threshold: 15, instruction: 'BERTAHAN!',
          onSuccess: { goto: 'rufus_beatup_survive' },
          onFail: { goto: 'rufus_beatup_fail' }
        }
      ]
    },
    
    rufus_beatup_survive: {
      background: { type: 'css', preset: 'forest' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Kau menangkis tongkat preman itu! Mereka terkejut!' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Mundur! Atau kubunuh salah satu dari kalian!' },
        { type: 'log', text: 'Kamu berhasil melawan Rufus dan mengusirnya walau babak belur.' },
        { type: 'goto', scene: 'episode2_end' }
      ]
    },

    rufus_beatup_fail: {
      background: { type: 'css', preset: 'forest' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Preman itu menendang rahangmu. Kau terkapar tak berdaya. Rufus merobek naskahmu.' },
        { type: 'log', text: 'Kamu dihajar habis-habisan oleh preman bayaran Rufus.' },
        { type: 'goto', scene: 'episode2_end' }
      ]
    },

    episode2_end: {
      background: { type: 'css', preset: 'forest' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: '(Lirih) Duniaku... tidak punya tempat untuk mereka yang lemah.' },
        { type: 'episode_review' },
        { type: 'goto', scene: 'episode3_start', transition: 'fade' }
      ]
    },

    // ==========================================
    // EPISODE 3
    // ==========================================
    episode3_start: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Episode 3: Sang Penjual Kata' },
        { type: 'dialogue', speaker: 'AYAH', portrait: 'right', text: 'Tiga tulang rusukmu hampir retak. Berhentilah, Rowan.' },
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Tidak. Kalau aku berhenti, aku selamanya pecundang.' },
        { type: 'goto', scene: 'gentong_bocor' }
      ]
    },

    gentong_bocor: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Di Kedai Gentong Bocor. Rowan menemui Bram si kakek tua.' },
        { type: 'dialogue', speaker: 'BRAM', portrait: 'right', text: 'Jika kau memang serius... temuilah Silas di Toko Buku Lumina. Informasi butuh pelindung.' },
        {
          type: 'choice',
          id: 'bram_help',
          options: [
            { 
              text: 'Mintalah bekal alat untuk menyusup', 
              requires: { relation: 'bram', stat: 'trust', value: '>=55' }, 
              effects: [
                { type: 'log', text: 'Bram percaya padamu dan memberikan alat kerjanya yang tersisa.' },
                { type: 'item_add', item: 'lockpick_tools' },
                { type: 'memory', text: 'Mendapat [Alat Lockpick]', icon: '🎒' }
              ], 
              goto: 'toko_buku_lumina' 
            },
            { 
              text: 'Ucapkan terima kasih dan pergi', 
              requires: null, 
              effects: [], 
              goto: 'toko_buku_lumina' 
            }
          ]
        }
      ]
    },

    toko_buku_lumina: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: 'SILAS', portrait: 'right', text: 'Kami bukan seniman. Kami Pialang Keselamatan. Pendaftaran senilai 50 Emas.' },
        { type: 'dialogue', speaker: 'SILAS', portrait: 'right', text: 'Atau rahasia yang nilainya setara dengan itu. Jika tidak, keluarlah.' },
        {
          type: 'choice',
          id: 'silas_deal',
          options: [
            {
              text: 'Aku akan membawakanmu ceritanya.',
              requires: null,
              effects: [
                { type: 'log', text: 'Kamu menerima syarat iblis Silas.' },
                { type: 'flag', key: 'will_search_secret', value: true }
              ],
              goto: 'accept_deal'
            },
            {
              text: 'Tolak mentah-mentah (Berhenti Merajut Mimpi)',
              requires: null,
              effects: [{ type: 'log', text: 'Kamu menolak Silas dan memutuskan mundur dari dunia pencerita selamanya.' }],
              goto: 'ending_coward'
            }
          ]
        }
      ]
    },

    ending_coward: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'BAD ENDING - Kau kembali ke ladang, hidup dihantui rasa takut.' },
        { type: 'episode_review' }
      ]
    },

    accept_deal: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Aku akan kembali dengan cerita yang tak pernah kau dengar sebelumnya.' },
        { type: 'goto', scene: 'post_credit', transition: 'fade' }
      ]
    },

    post_credit: {
      background: { type: 'css', preset: 'interior' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'POST-CREDIT...' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Ruang bawah tanah Toko Buku Lumina. Silas mengurung seorang anak kecil (Lian).' },
        { type: 'dialogue', speaker: 'SILAS', portrait: 'right', text: 'Selamat malam... kau siap menggambar untukku hari ini?' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'Tiba-tiba, Rowan menyelinap melalui ventilasi! Ini rahasia terbesarnya.' },
        {
          type: 'lockpick', difficulty: 'hard', attempts: 2,
          onSuccess: { 
            effects: [{ type: 'log', text: 'Berhasil meretas kunci sel rahasia Silas!' }],
            goto: 'secret_ending' 
          },
          onFail: { 
            effects: [{ type: 'log', text: 'Gagal membongkar kunci, Silas menyadari keberadaanmu!' }],
            goto: 'true_ending' 
          }
        }
      ]
    },

    secret_ending: {
      background: { type: 'css', preset: 'corridor' },
      beats: [
        { type: 'dialogue', speaker: 'ROWAN', portrait: 'left', text: 'Ayo lari, nak. Kita hancurkan sindikat ini dari dalam.' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'SECRET ENDING - Kau membebaskan Lian dan mengetahui akar informasi mereka. Perang baru saja dimulai.' },
        { type: 'episode_review' }
      ]
    },

    true_ending: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: 'SILAS', portrait: 'right', text: 'Siapa di sana?!' },
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'TRUE ENDING - Rowan harus melarikan diri tanpa bukti. Silas mulai memburunya.' },
        { type: 'episode_review' }
      ]
    },

    episode4_start: {
      background: { type: 'css', preset: 'alley' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'EPISODE 4: Mitos Area Belum Terjamah\n\n(Cerita sedang dalam tahap pengembangan akhir)' },
        { type: 'episode_review' }
      ]
    },
    
    episode5_start: {
      background: { type: 'css', preset: 'tavern' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'EPISODE 5: Penyusupan ke Lumina\n\n(Cerita sedang dalam tahap pengembangan akhir)' },
        { type: 'episode_review' }
      ]
    },
    
    episode6_start: {
      background: { type: 'css', preset: 'night_city' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'EPISODE 6: Suara dalam Gelap\n\n(Cerita sedang dalam tahap pengembangan akhir)' },
        { type: 'episode_review' }
      ]
    },
    
    episode7_start: {
      background: { type: 'css', preset: 'rooftop' },
      beats: [
        { type: 'dialogue', speaker: null, mode: 'narration', text: 'EPISODE 7: Gambar yang Bercerita\n\n(Cerita sedang dalam tahap pengembangan akhir)' },
        { type: 'episode_review' }
      ]
    }
  }
};
