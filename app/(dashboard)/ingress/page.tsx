import { RecordingsBrowser } from '@/components/recordings/recordings-browser';

export default function IngressPage() {
    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Ingress (Recordings)</h1>
                <p className="text-muted-foreground">
                    Browse and play audio recordings saved from Egress.
                </p>
            </div>
            <RecordingsBrowser />
        </div>
    );
}
