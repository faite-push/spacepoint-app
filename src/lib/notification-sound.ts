let audioContext: AudioContext | null = null;

function playBeep(volume = 0.5) {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    const ctx = audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.value = volume * 0.3;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // silently fail
  }
}

export function playNotificationSound(volume = 0.8) {
  const audio = new Audio('/notify.mp3');
  audio.volume = volume;
  audio.play().catch(() => playBeep(volume));
}
