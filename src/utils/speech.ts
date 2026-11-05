// Speech Recognition and Web Audio Spectrum Analyzer

export interface SpeechRecognitionHookOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
  continuous?: boolean;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public startListening(
    options: SpeechRecognitionHookOptions,
    onVisualData?: (levels: number[]) => void
  ): boolean {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (options.onError) {
        options.onError('Speech recognition is not supported on this browser. You can type your response!');
      }
      return false;
    }

    try {
      this.stopListening();

      const rec = new SpeechRecognitionClass();
      rec.continuous = options.continuous ?? false;
      rec.interimResults = true;
      rec.lang = options.lang || 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.isListening = true;
        this.startMicrophoneVisualizer(onVisualData);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        options.onResult(currentText, Boolean(finalTranscript));
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && options.onError) {
          options.onError(event.error);
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.stopMicrophoneVisualizer();
        if (options.onEnd) {
          options.onEnd();
        }
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      if (options.onError) options.onError(err?.message || 'Mic error');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.stopMicrophoneVisualizer();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // Live microphone frequency visualizer using Web Audio API
  private async startMicrophoneVisualizer(onVisualData?: (levels: number[]) => void) {
    if (!onVisualData || typeof window === 'undefined') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      this.analyser = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        // Extract 8 bar levels normalized 0 to 1
        const sampleCount = 8;
        const step = Math.floor(bufferLength / sampleCount);
        const bars: number[] = [];
        for (let i = 0; i < sampleCount; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.min(1, Math.max(0.08, val / 255)));
        }
        onVisualData(bars);
        this.animFrameId = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.warn('Microphone visualization not accessible:', err);
    }
  }

  private stopMicrophoneVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

export const speechEngine = new SpeechEngine();
