'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Copy, Video, Radio, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function IngressCreator() {
    const [roomName, setRoomName] = useState('');
    const [ingressType, setIngressType] = useState<'rtmp' | 'whip'>('rtmp');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ url: string; streamKey: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!roomName) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/ingress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, ingressType }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create ingress');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Create Live Stream Input (Ingress)
                    </CardTitle>
                    <CardDescription>
                        Generate a Stream Key to push video/audio from OBS, vMix, or other streaming software into a LiveKit room.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input
                            id="roomName"
                            placeholder="e.g. production-studio-1"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Ingress Protocol</Label>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-accent" onClick={() => setIngressType('rtmp')}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ingressType === 'rtmp' ? 'border-primary' : 'border-muted-foreground'}`}>
                                    {ingressType === 'rtmp' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="grid gap-1.5 leading-none">
                                    <span className="font-semibold">RTMP</span>
                                    <span className="text-xs text-muted-foreground">Standard for OBS, vMix</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-accent" onClick={() => setIngressType('whip')}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ingressType === 'whip' ? 'border-primary' : 'border-muted-foreground'}`}>
                                    {ingressType === 'whip' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="grid gap-1.5 leading-none">
                                    <span className="font-semibold">WHIP</span>
                                    <span className="text-xs text-muted-foreground">WebRTC-based, lower latency</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleCreate} disabled={!roomName || loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Keys...
                            </>
                        ) : (
                            'Generate Stream Key'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <Card className="border-green-500/50 bg-green-500/5">
                    <CardHeader>
                        <CardTitle className="text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Ingress Created Successfully
                        </CardTitle>
                        <CardDescription>
                            Enter these details into your streaming software (OBS).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Server URL</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={result.url} className="font-mono bg-background" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.url)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Stream Key</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={result.streamKey} className="font-mono bg-background" type="password" />
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.streamKey)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
