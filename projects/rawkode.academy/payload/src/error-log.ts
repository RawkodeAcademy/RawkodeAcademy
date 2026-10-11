type LoggedError = { name: string; message: string; cause?: LoggedError; causeTruncated?: true }

/** Preserve D1's nested cause without serializing query parameters or custom
 * error properties. Bound depth and cycles so diagnostics cannot recurse. */
export function errorLogReplacer(_key: string, value: unknown): unknown {
  if (!(value instanceof Error)) return value
  const seen = new Set<Error>()
  function describe(error: Error, depth: number): LoggedError {
    seen.add(error)
    const result: LoggedError = { name: error.name, message: error.message }
    if (error.cause instanceof Error) {
      if (depth >= 4 || seen.has(error.cause)) result.causeTruncated = true
      else result.cause = describe(error.cause, depth + 1)
    }
    return result
  }
  return describe(value, 0)
}
