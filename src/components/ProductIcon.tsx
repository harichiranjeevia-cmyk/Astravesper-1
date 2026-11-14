import {
  Cpu,
  Layers,
  Music2,
  Palette,
  Rocket,
  Sparkles,
  Workflow,
} from 'lucide-react';

export function ProductIcon({
  iconKey,
  className = 'w-6 h-6',
}: {
  iconKey?: string;
  className?: string;
}) {
  switch (iconKey) {
    case 'music':
      return <Music2 className={className} />;
    case 'workflow':
      return <Workflow className={className} />;
    case 'ai':
      return <Sparkles className={className} />;
    case 'creative':
      return <Palette className={className} />;
    case 'future':
      return <Rocket className={className} />;
    case 'compute':
      return <Cpu className={className} />;
    default:
      return <Layers className={className} />;
  }
}
