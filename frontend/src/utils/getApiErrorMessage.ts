// ======================================================
// src/utils/getApiErrorMessage.ts
// ======================================================

import axios from "axios";

// ======================================================
// TYPES
// ======================================================

interface ApiErrorResponse {
  detail?: string | ValidationError[];
  message?: string;
}

interface ValidationError {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

// ======================================================
// DEFAULT MESSAGE
// ======================================================

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

// ======================================================
// FORMAT VALIDATION ERROR
// ======================================================

function formatValidationErrors(
  errors: ValidationError[],
): string {
  const messages = errors
    .map((error) => error.msg)
    .filter(
      (message): message is string =>
        Boolean(message),
    );

  if (messages.length === 0) {
    return (
      "Some information is invalid. " +
      "Please review your input."
    );
  }

  return messages.join(" ");
}

// ======================================================
// GET API ERROR MESSAGE
// ======================================================

export function getApiErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  // ====================================================
  // AXIOS ERROR
  // ====================================================

  if (
    axios.isAxiosError<ApiErrorResponse>(error)
  ) {
    const response = error.response;

    // ==================================================
    // NETWORK / SERVER UNREACHABLE
    // ==================================================

    if (!response) {
      return (
        "Unable to connect to Finora. " +
        "Please check your connection " +
        "and try again."
      );
    }

    const data = response.data;

    // ==================================================
    // FASTAPI STRING DETAIL
    // ==================================================

    if (
      typeof data?.detail === "string" &&
      data.detail.trim()
    ) {
      return data.detail;
    }

    // ==================================================
    // FASTAPI VALIDATION ERRORS
    // ==================================================

    if (Array.isArray(data?.detail)) {
      return formatValidationErrors(
        data.detail,
      );
    }

    // ==================================================
    // GENERIC API MESSAGE
    // ==================================================

    if (
      typeof data?.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    // ==================================================
    // HTTP STATUS FALLBACKS
    // ==================================================

    switch (response.status) {
      case 400:
        return (
          "The request could not be completed. " +
          "Please review the information and try again."
        );

      case 401:
        return (
          "Your credentials could not be verified."
        );

      case 403:
        return (
          "You don't have permission to perform this action."
        );

      case 404:
        return (
          "The requested resource could not be found."
        );

      case 409:
        return (
          "This action conflicts with existing information."
        );

      case 422:
        return (
          "Some information is invalid. " +
          "Please review your input."
        );

      case 429:
        return (
          "Too many requests. " +
          "Please wait a moment and try again."
        );

      case 500:
        return (
          "Finora encountered an unexpected error. " +
          "Please try again."
        );

      case 502:
        return (
          "Finora is temporarily unavailable. " +
          "Please try again shortly."
        );

      case 503:
        return (
          "Finora is temporarily unavailable. " +
          "Please try again shortly."
        );

      case 504:
        return (
          "Finora is temporarily unavailable. " +
          "Please try again shortly."
        );
    }

    // ==================================================
    // OTHER SERVER ERRORS
    // ==================================================

    if (response.status >= 500) {
      return (
        "Finora encountered a server error. " +
        "Please try again shortly."
      );
    }

    return fallback;
  }

  // ====================================================
  // STANDARD JAVASCRIPT ERROR
  // ====================================================

  if (error instanceof Error) {
    /*
     * Avoid exposing arbitrary internal
     * error messages to the user.
     *
     * The caller-provided fallback is safer
     * for unexpected application errors.
     */
    return fallback;
  }

  // ====================================================
  // UNKNOWN ERROR
  // ====================================================

  return fallback;
}

