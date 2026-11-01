'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type SipProvider = 'twilio' | 'telnyx';

type ConnectSipTrunkingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ConnectSipTrunkingDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConnectSipTrunkingDialogProps) {
  const [provider, setProvider] = useState<SipProvider>('twilio');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [terminationUri, setTerminationUri] = useState('');
  const [sipUsername, setSipUsername] = useState('');
  const [sipPassword, setSipPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [transport, setTransport] = useState<'TCP' | 'UDP' | 'TLS'>('TCP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const phone = phoneNumber.trim();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    if (provider === 'telnyx' && !sipUsername.trim()) {
      setError('SIP username is required for Telnyx (used for FQDN connection and outbound auth).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/phone-numbers/connect-sip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          phone_number: phone,
          termination_uri: terminationUri.trim() || undefined,
          sip_trunk_username: sipUsername.trim() || undefined,
          sip_trunk_password: sipPassword ? sipPassword : undefined,
          nickname: nickname.trim() || undefined,
          transport,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = await res.json();
      setPhoneNumber('');
      setTerminationUri('');
      setSipUsername('');
      setSipPassword('');
      setNickname('');
      setTransport('TCP');
      onOpenChange(false);
      if (provider === 'telnyx') {
        toast.success(
          data.sip_endpoint
            ? `Telnyx number connected. In Telnyx Portal set the SIP FQDN to ${data.sip_endpoint} (port 5060) and assign this number to the connection.`
            : 'Telnyx number connected. In Telnyx Portal set the SIP FQDN to your LiveKit SIP endpoint and assign this number to the connection.'
        );
      } else {
        toast.success('Inbound number connected. Set the Twilio Voice URL and SIP_INBOUND_TRUNK_* in your webhook server so calls to this number reach your agent.');
      }
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect number');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {provider === 'telnyx' ? 'Connect your Telnyx number' : 'Connect your Twilio number'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="grid gap-2">
            <Label>SIP provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as SipProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="telnyx">Telnyx</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {provider === 'telnyx'
              ? 'When someone calls this Telnyx number, the call is sent to LiveKit via your Telnyx FQDN connection. Use the same SIP username and password in Telnyx Portal (Credentials auth) and here. Outbound trunk is created with X-Telnyx-Username for digest auth.'
              : 'When someone calls this Twilio number, the call will be routed to your agent. Use the same SIP username and password in your webhook server (SIP_INBOUND_TRUNK_USERNAME / SIP_INBOUND_TRUNK_PASSWORD).'}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="phone">{provider === 'telnyx' ? 'Telnyx' : 'Twilio'} phone number (E.164)</Label>
            <Input
              id="phone"
              placeholder="e.g. +14155551234"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="termination-uri">Termination URI (optional, for outbound only)</Label>
            <Input
              id="termination-uri"
              placeholder="Leave empty for inbound-only"
              value={terminationUri}
              onChange={(e) => setTerminationUri(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sip-username">
              SIP username {provider === 'telnyx' ? '(Telnyx FQDN connection + LiveKit)' : '(for Twilio → LiveKit)'}
            </Label>
            <Input
              id="sip-username"
              placeholder={provider === 'telnyx' ? 'Same as in Telnyx FQDN credentials' : 'Same as SIP_INBOUND_TRUNK_USERNAME in webhook server'}
              value={sipUsername}
              onChange={(e) => setSipUsername(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sip-password">SIP password {provider === 'telnyx' ? '(Telnyx + LiveKit)' : '(for Twilio → LiveKit)'}</Label>
            <Input
              id="sip-password"
              type="password"
              placeholder="Enter SIP Trunk Password"
              value={sipPassword}
              onChange={(e) => setSipPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              placeholder="Enter Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Transport (optional)</Label>
            <Select value={transport} onValueChange={(v) => setTransport(v as 'TCP' | 'UDP' | 'TLS')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TCP">TCP</SelectItem>
                <SelectItem value="UDP">UDP</SelectItem>
                <SelectItem value="TLS">TLS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
