import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const DEFAULT_COOLDOWN_SECONDS = 60

export function useEmailCode(requestCode: (email: string) => Promise<unknown>) {
  const [cooldown, setCooldown] = useState(0)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const mutation = useMutation({
    mutationFn: requestCode,
    onSuccess: () => {
      setCooldown(DEFAULT_COOLDOWN_SECONDS)
      showSuccessToast("Verification code sent")
    },
    onError: handleError.bind(showErrorToast),
  })

  return {
    cooldown,
    isPending: mutation.isPending,
    sendCode: mutation.mutate,
  }
}
