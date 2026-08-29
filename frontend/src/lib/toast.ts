// ======================================================
// src/lib/toast.ts
// ======================================================

import {
  toast,
} from "sonner";


// ======================================================
// TYPES
// ======================================================

interface ToastOptions {

  description?: string;

  duration?: number;

}


interface PromiseMessages<T> {

  loading: string;

  success:
    | string
    | ((data: T) => string);

  error:
    | string
    | ((error: unknown) => string);

}


// ======================================================
// SUCCESS
// ======================================================

function success(
  title: string,
  options?: ToastOptions
) {

  return toast.success(
    title,
    {
      description:
        options?.description,

      duration:
        options?.duration,
    }
  );

}


// ======================================================
// ERROR
// ======================================================

function error(
  title: string,
  options?: ToastOptions
) {

  return toast.error(
    title,
    {
      description:
        options?.description,

      duration:
        options?.duration ?? 5000,
    }
  );

}


// ======================================================
// WARNING
// ======================================================

function warning(
  title: string,
  options?: ToastOptions
) {

  return toast.warning(
    title,
    {
      description:
        options?.description,

      duration:
        options?.duration ?? 5000,
    }
  );

}


// ======================================================
// INFO
// ======================================================

function info(
  title: string,
  options?: ToastOptions
) {

  return toast.info(
    title,
    {
      description:
        options?.description,

      duration:
        options?.duration,
    }
  );

}


// ======================================================
// LOADING
// ======================================================

function loading(
  title: string
) {

  return toast.loading(
    title
  );

}


// ======================================================
// PROMISE
// ======================================================

function promise<T>(
  promiseValue:
    Promise<T> |
    (() => Promise<T>),

  messages:
    PromiseMessages<T>
) {

  return toast.promise(
    promiseValue,
    {
      loading:
        messages.loading,

      success:
        messages.success,

      error:
        messages.error,
    }
  );

}


// ======================================================
// DISMISS
// ======================================================

function dismiss(
  toastId?: string | number
) {

  toast.dismiss(
    toastId
  );

}


// ======================================================
// FINORA TOAST API
// ======================================================

export const appToast = {

  success,

  error,

  warning,

  info,

  loading,

  promise,

  dismiss,

};