import { useState, useRef, useCallback } from 'react';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
  interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((ev: Event) => void) | null;
    onend: ((ev: Event) => void) | null;
    onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
    onerror: ((ev: SpeechRecognitionErrorEventInstance) => void) | null;
  }
  interface SpeechRecognitionResultEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionErrorEventInstance extends Event {
    error: string;
    message: string;
  }
}

interface SpeechOptions {
  lang?: string;
  onResult?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useSpeech(options: SpeechOptions = {}) {
  const { lang = 'zh-CN', onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('您的浏览器不支持语音识别');
      return;
    }
    if (isListening) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const resultList = event.results;
      const result = resultList[resultList.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        onResult?.(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventInstance) => {
      setIsListening(false);
      const errorMap: Record<string, string> = {
        network: '网络错误，语音识别失败',
        'not-allowed': '请允许麦克风权限',
        'no-speech': '未检测到语音',
        aborted: '语音识别已中止',
      };
      onError?.(errorMap[event.error] || `语音识别错误: ${event.error}`);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, lang, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => setTranscript(''), []);

  return { isListening, transcript, startListening, stopListening, reset, isSupported };
}
