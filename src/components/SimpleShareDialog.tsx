import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface SimpleShareDialogProps {
  open: boolean;
  onClose: () => void;
}

const SimpleShareDialog: React.FC<SimpleShareDialogProps> = ({ open, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-xs px-4 py-3 flex items-center justify-center min-h-[100px]
      [&_[data-slot=dialog-close]]:focus:outline-none
      [&_[data-slot=dialog-close]]:focus-visible:outline-none
      [&_[data-slot=dialog-close]]:focus:ring-0
      [&_[data-slot=dialog-close]]:focus-visible:ring-0">
      <DialogTitle className="sr-only">Share Link</DialogTitle>
      <div className="text-center text-base w-full">Link copied to clipboard!</div>
    </DialogContent>
  </Dialog>
);

export default SimpleShareDialog;