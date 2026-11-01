import { Button } from '../livekit/button';
import { Mic, MessageSquare, Phone } from 'lucide-react';

function WelcomeIcon() {
  return (
    <div className="relative mb-8">
      {}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-32 w-32 animate-pulse rounded-full bg-primary/10 dark:bg-primary/5" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-24 animate-pulse rounded-full bg-primary/20 dark:bg-primary/10 animation-delay-500" />
      </div>

      {}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
        <svg
          width="48"
          height="48"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-foreground"
        >
          <path
            d="M15 24V40C15 40.7957 14.6839 41.5587 14.1213 42.1213C13.5587 42.6839 12.7956 43 12 43C11.2044 43 10.4413 42.6839 9.87868 42.1213C9.31607 41.5587 9 40.7957 9 40V24C9 23.2044 9.31607 22.4413 9.87868 21.8787C10.4413 21.3161 11.2044 21 12 21C12.7956 21 13.5587 21.3161 14.1213 21.8787C14.6839 22.4413 15 23.2044 15 24ZM22 5C21.2044 5 20.4413 5.31607 19.8787 5.87868C19.3161 6.44129 19 7.20435 19 8V56C19 56.7957 19.3161 57.5587 19.8787 58.1213C20.4413 58.6839 21.2044 59 22 59C22.7956 59 23.5587 58.6839 24.1213 58.1213C24.6839 57.5587 25 56.7957 25 56V8C25 7.20435 24.6839 6.44129 24.1213 5.87868C23.5587 5.31607 22.7956 5 22 5ZM32 13C31.2044 13 30.4413 13.3161 29.8787 13.8787C29.3161 14.4413 29 15.2044 29 16V48C29 48.7957 29.3161 49.5587 29.8787 50.1213C30.4413 50.6839 31.2044 51 32 51C32.7956 51 33.5587 50.6839 34.1213 50.1213C34.6839 49.5587 35 48.7957 35 48V16C35 15.2044 34.6839 14.4413 34.1213 13.8787C33.5587 13.3161 32.7956 13 32 13ZM42 21C41.2043 21 40.4413 21.3161 39.8787 21.8787C39.3161 22.4413 39 23.2044 39 24V40C39 40.7957 39.3161 41.5587 39.8787 42.1213C40.4413 42.6839 41.2043 43 42 43C42.7957 43 43.5587 42.6839 44.1213 42.1213C44.6839 41.5587 45 40.7957 45 40V24C45 23.2044 44.6839 22.4413 44.1213 21.8787C43.5587 21.3161 42.7957 21 42 21ZM52 17C51.2043 17 50.4413 17.3161 49.8787 17.8787C49.3161 18.4413 49 19.2044 49 20V44C49 44.7957 49.3161 45.5587 49.8787 46.1213C50.4413 46.6839 51.2043 47 52 47C52.7957 47 53.5587 46.6839 54.1213 46.1213C54.6839 45.5587 55 44.7957 55 44V20C55 19.2044 54.6839 18.4413 54.1213 17.8787C53.5587 17.3161 52.7957 17 52 17Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      {}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="h-full w-full overflow-hidden bg-blue-500">
      <section className="bg-background min-h-[620px] flex h-full w-full flex-col items-center px-4 py-6 text-center">
        <div className="w-full h-full flex flex-col">
          {}
          <div className="mb-6 flex items-center gap-0 border-b border-border/40 rounded-full">
            <button className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors relative -mb-[1px] text-foreground rounded-l-full border border-border/40 bg-background">
              <Phone className="h-3.5 w-3.5" />
              <span>Test Audio</span>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors relative -mb-[1px] text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Test Chat</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors relative -mb-[1px] text-muted-foreground hover:text-foreground rounded-r-full">
              <span className="text-base font-normal leading-none">{}</span>
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center space-y-5">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-muted/60 border border-border/40">
              <Mic className="h-14 w-14 text-muted-foreground/70" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-base font-medium text-foreground">Test your agent</p>
              <Button
                variant="primary"
                size="lg"
                onClick={onStartCall}
                className="h-10 px-6 text-sm font-medium"
              >
                Test
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
