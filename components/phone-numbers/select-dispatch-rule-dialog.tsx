'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/assistants/config/livekit/alert';
import { Skeleton } from '@/components/ui/skeleton';

type SIPDispatchRule = {
  sip_dispatch_rule_id: string;
  name: string;
  rule: {
    dispatch_rule_individual?: {
      room_prefix?: string;
    };
    dispatch_rule_direct?: {
      room_name?: string;
    };
  };
  trunk_ids?: string[];
  inbound_numbers?: string[];
};

type SelectDispatchRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onComplete?: () => void;
};

export function SelectDispatchRuleDialog({
  open,
  onOpenChange,
  phoneNumber,
  onComplete,
}: SelectDispatchRuleDialogProps) {
  const [rules, setRules] = useState<SIPDispatchRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchRules();
    }
  }, [open]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dispatch-rules');
      if (!response.ok) {
        throw new Error('Failed to fetch dispatch rules');
      }
      const data = await response.json();
      setRules(data.items || []);
    } catch (err) {
      console.error('Error fetching dispatch rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dispatch rules');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRuleId) return;

    try {
      setAssigning(true);
      setError(null);

      const phoneNumbersResponse = await fetch('/api/phone-numbers');
      if (!phoneNumbersResponse.ok) {
        throw new Error('Failed to fetch phone numbers');
      }
      const phoneNumbers = await phoneNumbersResponse.json();
      
      const phoneNumberItem = phoneNumbers.items?.find(
        (p: any) => p.e164_format === phoneNumber || p.id === phoneNumber
      );

      if (!phoneNumberItem) {
        throw new Error(`Phone number ${phoneNumber} not found`);
      }

      const response = await fetch(`/api/phone-numbers/${phoneNumberItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sip_dispatch_rule_id: selectedRuleId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to assign dispatch rule');
      }

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error assigning dispatch rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign dispatch rule');
    } finally {
      setAssigning(false);
    }
  };

  const filteredRules = rules.filter((rule) =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.sip_dispatch_rule_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRuleTypeLabel = (rule: SIPDispatchRule) => {
    if (rule.rule.dispatch_rule_individual) {
      return 'Individual';
    }
    if (rule.rule.dispatch_rule_direct) {
      return 'Direct';
    }
    return 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure number</DialogTitle>
          <DialogDescription>
            Configure origination by setting up how the phone number will be dispatched to LiveKit
            rooms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <div className="flex items-center gap-2">
              <Input value={phoneNumber} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.writeText(phoneNumber)}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <label className="text-sm font-medium">Number dispatch</label>
            <p className="text-sm text-muted-foreground">
              Configure origination by setting up how the phone number will be dispatched to
              LiveKit rooms by matching phone numbers and specific trunks. If no number or trunk is
              selected, the rule will be applied to all.
            </p>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by dispatch rule"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-auto border rounded-md mt-2">
              {loading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredRules.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No dispatch rules created yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredRules.map((rule) => (
                    <div
                      key={rule.sip_dispatch_rule_id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedRuleId === rule.sip_dispatch_rule_id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedRuleId(rule.sip_dispatch_rule_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Type: {getRuleTypeLabel(rule)} • ID: {rule.sip_dispatch_rule_id}
                          </div>
                        </div>
                        {selectedRuleId === rule.sip_dispatch_rule_id && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => window.open('https://docs.livekit.io/telephony/accepting-calls/dispatch-rule/', '_blank')}>
            Learn more in the docs
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedRuleId || assigning}>
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
