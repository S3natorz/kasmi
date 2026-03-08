'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type VoiceInputOptions = {
  lang?: string
  continuous?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

type VoiceInputState = {
  isListening: boolean
  isSupported: boolean
  transcript: string
  error: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any

function getSpeechRecognitionAPI(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any

  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
  const { lang = 'id-ID', continuous = false, onResult, onError } = options

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    error: null
  })

  const recognitionRef = useRef<SpeechRecognitionInstance>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Keep refs updated
  onResultRef.current = onResult
  onErrorRef.current = onError

  // Check support on mount
  useEffect(() => {
    const isSupported = !!getSpeechRecognitionAPI()

    setState(prev => ({ ...prev, isSupported }))
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI()

    if (!SpeechRecognitionAPI) {
      const errMsg = 'Browser tidak mendukung speech recognition'
      setState(prev => ({ ...prev, error: errMsg }))
      onErrorRef.current?.(errMsg)
      return
    }

    // Stop previous if any
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]

        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      const transcript = finalTranscript || interimTranscript
      setState(prev => ({ ...prev, transcript }))
      onResultRef.current?.(transcript, !!finalTranscript)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      let errMsg = 'Terjadi kesalahan'

      switch (event.error) {
        case 'not-allowed':
          errMsg = 'Akses mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser.'
          break
        case 'no-speech':
          errMsg = 'Tidak terdeteksi suara. Coba lagi.'
          break
        case 'audio-capture':
          errMsg = 'Mikrofon tidak ditemukan.'
          break
        case 'network':
          errMsg = 'Koneksi internet diperlukan untuk speech recognition.'
          break
        case 'aborted':
          // User cancelled, no error message needed
          setState(prev => ({ ...prev, isListening: false }))
          return
      }

      setState(prev => ({ ...prev, error: errMsg, isListening: false }))
      onErrorRef.current?.(errMsg)
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [lang, continuous])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening
  }
}
