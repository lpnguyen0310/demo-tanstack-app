type MutationErrorProps = {
  show: boolean
  message: string
}

export function MutationError({ show, message }: MutationErrorProps) {
  if (!show) return null

  return (
    <p className="mt-2 text-sm text-red-600">
      {message}
    </p>
  )
}
