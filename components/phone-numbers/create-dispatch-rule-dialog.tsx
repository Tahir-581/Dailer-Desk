'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, Info, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/assistants/config/livekit/alert';
import { Skeleton } from '@/components/ui/skeleton';

type PhoneNumber = {
  id: string;
  e164_format: string;
  status: string;
};

type CreateDispatchRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onComplete?: () => void;
};

type DispatchRuleFormData = {
  name: string;
  ruleType: 'individual' | 'direct';
  roomPrefix: string;
  roomName: string;
  agentName: string;
  dispatchMetadata: string;
  selectedPhoneNumbers: string[];
  selectedTrunks: string[];
};

export function CreateDispatchRuleDialog({
  open,
  onOpenChange,
  phoneNumber,
  onComplete,
}: CreateDispatchRuleDialogProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'json'>('details');
  const [formData, setFormData] = useState<DispatchRuleFormData>({
    name: 'My rule',
    ruleType: 'individual',
    roomPrefix: 'pre-',
    roomName: '',
    agentName: 'My telephony agent',
    dispatchMetadata: '',
    selectedPhoneNumbers: [],
    selectedTrunks: [],
  });
  const [jsonContent, setJsonContent] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);
  const [phoneNumberSearch, setPhoneNumberSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routingTab, setRoutingTab] = useState<'phone-numbers' | 'trunks'>('phone-numbers');

  useEffect(() => {
    if (open) {
      fetchPhoneNumbers();
      updateJsonFromForm();
      if (phoneNumber) {
        setFormData((prev) => ({
          ...prev,
          selectedPhoneNumbers: [phoneNumber],
        }));
      }
    }
  }, [open, phoneNumber]);

  useEffect(() => {
    if (activeTab === 'details') {
      updateJsonFromForm();
    }
  }, [formData, activeTab]);

  const fetchPhoneNumbers = async () => {
    try {
      setLoadingPhoneNumbers(true);
      const response = await fetch('/api/phone-numbers');
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }
      const data = await response.json();
      setPhoneNumbers(data.items || []);
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  };

  const updateJsonFromForm = () => {
    const rule: any = {};
    if (formData.ruleType === 'individual') {
      rule.dispatch_rule_individual = {
        room_prefix: formData.roomPrefix || undefined,
      };
    } else {
      rule.dispatch_rule_direct = {
        room_name: formData.roomName || undefined,
      };
    }

    const roomConfig: any = {};
    if (formData.agentName) {
      roomConfig.agents = [
        {
          name: formData.agentName,
          ...(formData.dispatchMetadata
            ? { metadata: JSON.parse(formData.dispatchMetadata || '{}') }
            : {}),
        },
      ];
    }

    const jsonObj = {
      rule,
      trunk_ids: formData.selectedTrunks.length > 0 ? formData.selectedTrunks : undefined,
      inbound_numbers:
        formData.selectedPhoneNumbers.length > 0 ? formData.selectedPhoneNumbers : undefined,
      ...(Object.keys(roomConfig).length > 0 ? { room_config: roomConfig } : {}),
    };

    setJsonContent(JSON.stringify(jsonObj, null, 2));
  };

  const updateFormFromJson = () => {
    try {
      const jsonObj = JSON.parse(jsonContent);
      const newFormData: DispatchRuleFormData = {
        name: formData.name,
        ruleType: jsonObj.rule?.dispatch_rule_individual ? 'individual' : 'direct',
        roomPrefix:
          jsonObj.rule?.dispatch_rule_individual?.room_prefix || formData.roomPrefix,
        roomName: jsonObj.rule?.dispatch_rule_direct?.room_name || formData.roomName,
        agentName:
          jsonObj.room_config?.agents?.[0]?.name || formData.agentName,
        dispatchMetadata: jsonObj.room_config?.agents?.[0]?.metadata
          ? JSON.stringify(jsonObj.room_config.agents[0].metadata, null, 2)
          : '',
        selectedPhoneNumbers: jsonObj.inbound_numbers || [],
        selectedTrunks: jsonObj.trunk_ids || [],
      };
      setFormData(newFormData);
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);

      let requestBody: any;
      if (activeTab === 'json') {
        requestBody = JSON.parse(jsonContent);
        requestBody.name = formData.name || 'My rule';
      } else {
        const rule: any = {};
        if (formData.ruleType === 'individual') {
          rule.dispatch_rule_individual = {
            room_prefix: formData.roomPrefix || undefined,
          };
        } else {
          rule.dispatch_rule_direct = {
            room_name: formData.roomName || undefined,
          };
        }

        const roomConfig: any = {};
        if (formData.agentName) {
          roomConfig.agents = [
            {
              name: formData.agentName,
              ...(formData.dispatchMetadata
                ? { metadata: JSON.parse(formData.dispatchMetadata || '{}') }
                : {}),
            },
          ];
        }

        requestBody = {
          name: formData.name || 'My rule',
          rule,
          trunk_ids: formData.selectedTrunks.length > 0 ? formData.selectedTrunks : [],
          inbound_numbers:
            formData.selectedPhoneNumbers.length > 0 ? formData.selectedPhoneNumbers : [],
          ...(Object.keys(roomConfig).length > 0 ? { room_config: roomConfig } : {}),
        };
      }

      const response = await fetch('/api/dispatch-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create dispatch rule');
      }

      const createdRule = await response.json();

      if (phoneNumber) {
        const phoneNumberId = phoneNumber.replace(/[^\d+]/g, '');
        const phoneNumbers = await fetch('/api/phone-numbers').then((r) => r.json());
        const phoneNumberItem = phoneNumbers.items?.find(
          (p: any) => p.e164_format === phoneNumber || p.id === phoneNumberId
        );

        if (phoneNumberItem) {
          await fetch(`/api/phone-numbers/${phoneNumberItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sip_dispatch_rule_id: createdRule.sip_dispatch_rule_id,
            }),
          });
        }
      }

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error creating dispatch rule:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create dispatch rule. Please check your JSON syntax.'
      );
    } finally {
      setCreating(false);
    }
  };

  const togglePhoneNumber = (e164Format: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPhoneNumbers: prev.selectedPhoneNumbers.includes(e164Format)
        ? prev.selectedPhoneNumbers.filter((n) => n !== e164Format)
        : [...prev.selectedPhoneNumbers, e164Format],
    }));
  };

  const filteredPhoneNumbers = useMemo(() => {
    return phoneNumbers.filter((p) =>
      p.e164_format.toLowerCase().includes(phoneNumberSearch.toLowerCase())
    );
  }, [phoneNumbers, phoneNumberSearch]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonContent);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create a new dispatch rule</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'json')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">DISPATCH RULE DETAILS</TabsTrigger>
              <TabsTrigger value="json">JSON EDITOR</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4 flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule name</Label>
                <Input
                  id="rule-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My rule"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="rule-type">Rule type</Label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Select
                  value={formData.ruleType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      ruleType: value as 'individual' | 'direct',
                    }))
                  }
                >
                  <SelectTrigger id="rule-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.ruleType === 'individual' ? (
                <div className="space-y-2">
                  <Label htmlFor="room-prefix">Room prefix</Label>
                  <Input
                    id="room-prefix"
                    value={formData.roomPrefix}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, roomPrefix: e.target.value }))
                    }
                    placeholder="pre-"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room name</Label>
                  <Input
                    id="room-name"
                    value={formData.roomName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, roomName: e.target.value }))
                    }
                    placeholder="my-room"
                  />
                </div>
              )}

              <div className="space-y-4 border-t pt-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Agent dispatch</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure an agent to dispatch to LiveKit rooms and enable inbound calling for
                    your agent.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-name">Agent name</Label>
                      <Input
                        id="agent-name"
                        value={formData.agentName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, agentName: e.target.value }))
                        }
                        placeholder="My telephony agent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dispatch-metadata">Dispatch metadata</Label>
                      <Textarea
                        id="dispatch-metadata"
                        value={formData.dispatchMetadata}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, dispatchMetadata: e.target.value }))
                        }
                        placeholder={"Include details like user's ID, name, or phone number in JSON format"}
                        className="min-h-[100px] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Inbound routing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure origination by setting up how inbound calls will be dispatched to
                      LiveKit rooms by matching phone numbers and specific trunks. If no number or
                      trunk is selected, the rule will be applied to all.
                    </p>

                    <Tabs value={routingTab} onValueChange={(v) => setRoutingTab(v as any)}>
                      <TabsList>
                        <TabsTrigger value="phone-numbers">Phone numbers</TabsTrigger>
                        <TabsTrigger value="trunks">Trunks</TabsTrigger>
                      </TabsList>

                      <TabsContent value="phone-numbers" className="mt-4">
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by phone number"
                              value={phoneNumberSearch}
                              onChange={(e) => setPhoneNumberSearch(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          <div className="border rounded-md max-h-[200px] overflow-auto">
                            {loadingPhoneNumbers ? (
                              <div className="p-4 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                              </div>
                            ) : filteredPhoneNumbers.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No phone numbers found
                              </div>
                            ) : (
                              <div className="divide-y">
                                {filteredPhoneNumbers.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center space-x-2 p-3 hover:bg-muted/50 cursor-pointer"
                                    onClick={() => togglePhoneNumber(p.e164_format)}
                                  >
                                    <Checkbox
                                      checked={formData.selectedPhoneNumbers.includes(
                                        p.e164_format
                                      )}
                                    />
                                    <span className="font-mono text-sm">{p.e164_format}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="trunks" className="mt-4">
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Trunk selection not yet implemented. Use JSON editor for trunk
                          configuration.
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="mt-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">sip-dispatch-rule-info.json</span>
                <Button variant="ghost" size="icon" onClick={handleCopyJson}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFormFromJson();
                  setActiveTab('details');
                }}
              >
                Apply to form
              </Button>
            </div>
            <Textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="flex-1 font-mono text-xs"
              placeholder="{}"
            />
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() =>
              window.open('https://docs.livekit.io/telephony/accepting-calls/dispatch-rule/', '_blank')
            }
          >
            Learn more in the docs
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
