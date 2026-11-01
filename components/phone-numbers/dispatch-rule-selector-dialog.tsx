'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, CheckCircle2, ChevronDown } from 'lucide-react';
import { CreateDispatchRuleDialog } from './create-dispatch-rule-dialog';
import { SelectDispatchRuleDialog } from './select-dispatch-rule-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type DispatchRuleSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onComplete?: () => void;
};

export function DispatchRuleSelectorDialog({
  open,
  onOpenChange,
  phoneNumber,
  onComplete,
}: DispatchRuleSelectorDialogProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);

  const handleUseExisting = () => {
    setSelectDialogOpen(true);
  };

  const handleCreateNew = () => {
    setCreateDialogOpen(true);
  };

  const handleComplete = () => {
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Phone className="w-12 h-12 text-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary animate-pulse" />
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 mb-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Purchase completed</span>
              </div>
            </div>
            <DialogTitle>Next: Assign your new number</DialogTitle>
            <DialogDescription className="text-center">
              You successfully purchased the phone number <strong>{phoneNumber}</strong>. Configure
              the number with a new or existing dispatch rule to begin routing calls.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleUseExisting}
            >
              <CardHeader>
                <CardTitle className="text-lg">Configure with dispatch rules</CardTitle>
                <CardDescription>
                  Connect your newly purchased number to an existing dispatch rule.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleCreateNew}
            >
              <CardHeader>
                <CardTitle className="text-lg">Create new dispatch rule</CardTitle>
                <CardDescription>
                  Set up a custom workflow for this number by creating a new dispatch rule.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-4 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  More options
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenChange(false)}>
                  Buy another number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/dispatch-rules', '_blank')}>
                  View dispatch rules
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.reload()}>
                  View phone numbers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleComplete}>
                  Assign the number later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      <SelectDispatchRuleDialog
        open={selectDialogOpen}
        onOpenChange={setSelectDialogOpen}
        phoneNumber={phoneNumber}
        onComplete={handleComplete}
      />

      <CreateDispatchRuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        phoneNumber={phoneNumber}
        onComplete={handleComplete}
      />
    </>
  );
}
