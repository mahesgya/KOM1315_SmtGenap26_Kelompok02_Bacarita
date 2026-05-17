interface AudioContextGlobal extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export enum WarningType {
  not_detected = 'not_detected',
  turning = 'turning',
  glance = 'glance',
}

export const WARNING_MESSAGES: Record<WarningType, { title: string; message: string }> = {
  [WarningType.not_detected]: {
    title: '⚠️ Tidak Terdeteksi',
    message: 'Kamu ke mana, mari lanjut baca',
  },
  [WarningType.turning]: {
    title: '⚠️ Menoleh',
    message: 'Kamu menoleh, yuk kembali ke bacaan',
  },
  [WarningType.glance]: {
    title: '⚠️ Melirik',
    message: 'Matamu ke samping, ayo fokus lagi',
  },
};

export let AUDIO_ENABLED = false;
export const setAudioEnabled = (v: boolean) => { AUDIO_ENABLED = !!v; };

/**
 * Play warning sound effect based on type
 */
export function playWarningSound(type: WarningType): void {
  if (!AUDIO_ENABLED) return;
  try {
    const AudioContextClass = (window as AudioContextGlobal).AudioContext || 
                              (window as AudioContextGlobal).webkitAudioContext;
    if (!AudioContextClass) return;

    const ac = new AudioContextClass();
    
    const frequencies: Record<WarningType, number[]> = {
      [WarningType.not_detected]: [600, 800],
      [WarningType.turning]: [800, 600, 800],
      [WarningType.glance]: [500, 700, 500],
    };

    const freq = frequencies[type] || [600];
    let delay = 0;

    freq.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      
  g.gain.setValueAtTime(0.1, ac.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + delay + 0.15);
      
      o.connect(g);
      g.connect(ac.destination);
      o.start(ac.currentTime + delay);
      o.stop(ac.currentTime + delay + 0.15);
      
  delay += 0.15;
    });
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

/**
 * Play beep sound (untuk calibration atau status lain)
 */
export function playBeepSound(frequency: number = 800, duration: number = 100): void {
  if (!AUDIO_ENABLED) return;
  try {
    const AudioContextClass = (window as AudioContextGlobal).AudioContext || 
                              (window as AudioContextGlobal).webkitAudioContext;
    if (!AudioContextClass) return;

    const ac = new AudioContextClass();
    const o = ac.createOscillator();
    const g = ac.createGain();
    
    o.type = 'sine';
    o.frequency.value = frequency;
    
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + duration / 1000);
    
    o.connect(g);
    g.connect(ac.destination);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + duration / 1000);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}

/**
 * Play success/calibration complete sound (upward sweep)
 */
export function playSuccessSound(): void {
  if (!AUDIO_ENABLED) return;
  try {
    const AudioContextClass = (window as AudioContextGlobal).AudioContext || 
                              (window as AudioContextGlobal).webkitAudioContext;
    if (!AudioContextClass) return;

    const ac = new AudioContextClass();
    const o = ac.createOscillator();
    const g = ac.createGain();
    
    o.type = 'sine';
    o.frequency.setValueAtTime(400, ac.currentTime);
    o.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.2);
    
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.2);
    
    o.connect(g);
    g.connect(ac.destination);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + 0.2);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}
