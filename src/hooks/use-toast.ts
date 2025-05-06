
// A simple re-export of the shadcn/ui toast component to avoid circular dependencies
import { useToast as useToastShadcn } from "@/components/ui/use-toast";

export const useToast = useToastShadcn;
export const toast = useToastShadcn().toast;
