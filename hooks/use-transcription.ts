"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import type { TranscriptionResult, ProcessingStep, AudioUploadOptions } from "@/types"

export interface TranscriptionState {
  status: "idle" | "processing" | "completed" | "error"
  file: File | null
  currentStep: ProcessingStep
  progressPercent: number
  result: TranscriptionResult | null
  error: string | null
}

export interface TranscriptionActions {
  setFile: (file: File | null) => void
  startTranscription: (file: File, options: AudioUploadOptions) => Promise<void>
  reset: () => void
  clearError: () => void
}

export function useTranscription(): [TranscriptionState, TranscriptionActions] {
  const [status, setStatus] = useState<TranscriptionState["status"]>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("UPLOADING")
  const [progressPercent, setProgressPercent] = useState(0)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const startTranscription = useCallback(async (file: File, options: AudioUploadOptions) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setStatus("processing")
    setFile(file)
    setCurrentStep("UPLOADING")
    setProgressPercent(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("templateId", options.templateId || "standard")

      // プログレス更新用のインターバル
      const progressInterval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 95) return prev
          return prev + 1
        })
      }, 200)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "不明なエラー" }))
        throw new Error(errorData.error || "処理に失敗しました")
      }

      const data = await response.json()

      setResult({
        transcript: data.transcription,
        minutes: data.meetingMinutes,
        fileName: file.name,
        templateId: options.templateId || "standard",
        timestamp: Date.now(),
      })

      setCurrentStep("FINALIZING")
      setProgressPercent(100)
      setStatus("completed")

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // ユーザーによるキャンセルはエラーとして扱わない
        return
      }

      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました"
      setError(errorMessage)
      setStatus("error")
    }
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setStatus("idle")
    setFile(null)
    setCurrentStep("UPLOADING")
    setProgressPercent(0)
    setResult(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // クリーンアップ：アンマウント時に進行中のリクエストをキャンセル
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return [
    {
      status,
      file,
      currentStep,
      progressPercent,
      result,
      error,
    },
    {
      setFile,
      startTranscription,
      reset,
      clearError,
    },
  ]
}
