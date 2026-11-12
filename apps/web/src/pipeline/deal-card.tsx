import { useDraggable } from '@dnd-kit/core';
import type { DealCardFragment, DealStage } from '@nexo/graphql-schema/operations';
import { useId, type ReactElement } from 'react';
import { fullName, OPEN_STAGES, stageTone } from '../contacts/contact-utils';
import { useI18n } from '../i18n/i18n-context';
import { formatCurrencyFromCents } from '../i18n/messages';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface DealCardProps {
  deal: DealCardFragment;
  onMove: (deal: DealCardFragment, stage: DealStage) => void;
  moving: boolean;
}

export function DealCard({ deal, onMove, moving }: DealCardProps): ReactElement {
  const { t } = useI18n();
  const titleId = useId();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const contactName = deal.contact ? fullName(deal.contact) : t('pipeline.unassigned');
  const availableStages = OPEN_STAGES.filter((stage) => stage !== deal.stage);

  return (
    <li
      ref={setNodeRef}
      aria-labelledby={titleId}
      style={
        transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
      }
      className={`space-y-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p id={titleId} className="font-medium">
            {deal.title}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{contactName}</p>
        </div>
        <button
          type="button"
          aria-label={`${t('pipeline.moveTo')} ${deal.title}`}
          className="cursor-grab rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{formatCurrencyFromCents(deal.valueCents)}</span>
        <Badge tone={stageTone(deal.stage)}>{t(`stage.${deal.stage}`)}</Badge>
      </div>

      <details className="group">
        <summary className="w-fit cursor-pointer rounded-[var(--radius-control)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
          {t('pipeline.moveTo')}
        </summary>
        <ul className="mt-2 space-y-1">
          {availableStages.map((stage) => (
            <li key={stage}>
              <Button
                variant="ghost"
                disabled={moving}
                aria-label={t('pipeline.moveToStage', { stage: t(`stage.${stage}`) })}
                className="w-full justify-start"
                onClick={() => onMove(deal, stage)}
              >
                {t(`stage.${stage}`)}
              </Button>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
