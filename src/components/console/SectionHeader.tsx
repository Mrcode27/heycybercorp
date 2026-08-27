import Icon from "../Icon";

/** Shared page heading for console sub-pages. */
export default function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
          <Icon name={icon} fill />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-on-surface-variant text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
