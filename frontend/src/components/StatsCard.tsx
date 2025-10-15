import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: string;
}

export const StatsCard = ({ label, value, trend }: StatsCardProps) => {
  return (
    <Card className="glass-card border-white/10 hover:border-accent/30 transition-smooth">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {value}
        </div>
        {trend && (
          <div className="text-sm text-accent mt-2">{trend}</div>
        )}
      </CardContent>
    </Card>
  );
};
