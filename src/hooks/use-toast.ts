
import { useState, useEffect } from 'react'
import type { ToastActionElement, ToastProps as ToastPrimitivesProps } from "@/components/ui/toast"

const TOAST_LIMIT = 20
const TOAST_REMOVE_DELAY = 1000

export type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | "success"
  duration?: number
}

type ToasterToast = ToastPrimitivesProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

export function useToast() {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: (props: ToastProps) => {
      const id = genId()

      const update = (props: Partial<ToasterToast>) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          id,
          open: true,
          ...props,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        } as ToasterToast,
      })

      return {
        id,
        dismiss,
        update,
      }
    },
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    remove: (toastId?: string) => dispatch({ type: actionTypes.REMOVE_TOAST, toastId }),
  }
}

export type Toast = ReturnType<typeof useToast>

// Create callable toast function
export const toast = ((props: ToastProps) => {
  const id = genId()
  
  const update = (newProps: Partial<ToasterToast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...newProps, id },
    });
    
  const dismiss = () => 
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: id
    });
  
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      id,
      open: true,
      ...props,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    } as ToasterToast,
  });
  
  return {
    id,
    dismiss,
    update,
  };
}) as ((props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void }) & {
  success: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  error: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  warning: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  info: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  default: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  destructive: (props: ToastProps) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void };
  dismiss: (toastId?: string) => void;
  remove: (toastId?: string) => void;
};

// Variant-specific toast functions
toast.success = (props: ToastProps) => toast({ ...props, variant: "success" });
toast.error = (props: ToastProps) => toast({ ...props, variant: "destructive" });
toast.warning = (props: ToastProps) => toast({ ...props, variant: "destructive" });
toast.info = (props: ToastProps) => toast(props);
toast.default = (props: ToastProps) => toast(props);
toast.destructive = (props: ToastProps) => toast({ ...props, variant: "destructive" });

// Utility methods
toast.dismiss = (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
toast.remove = (toastId?: string) => dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
