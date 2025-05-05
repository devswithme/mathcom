declare module 'sonner' {
  export const Toaster: React.FC<{
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    richColors?: boolean;
    [key: string]: any;
  }>;
  
  export function toast(
    message: string | React.ReactNode,
    options?: {
      description?: string | React.ReactNode;
      duration?: number;
      id?: string | number;
      icon?: React.ReactNode;
      action?: {
        label: string;
        onClick: () => void;
      };
      [key: string]: any;
    }
  ): void;

  export default toast;
} 