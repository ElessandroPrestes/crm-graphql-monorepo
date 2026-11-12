import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { CreateDealDocument, type DealStage } from '@nexo/graphql-schema/operations';
import { useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { SelectField, TextField } from '../ui/field';
import { InlineNotice } from '../ui/states';
import { OPEN_STAGES, parseReaisToCents } from './contact-utils';

interface DealForm {
  title: string;
  value: string;
  stage: DealStage;
  expectedCloseDate: string;
}

interface DealCreateDialogProps {
  open: boolean;
  contactId: string;
  companyId: string | null;
  onClose: () => void;
}

export function DealCreateDialog({
  open,
  contactId,
  companyId,
  onClose,
}: DealCreateDialogProps): ReactElement {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('contact.dealTitleRequired')),
        value: z.string().refine((value) => parseReaisToCents(value) !== null, {
          message: t('contact.dealValueInvalid'),
        }),
        stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
        expectedCloseDate: z.string(),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', value: '', stage: 'LEAD', expectedCloseDate: '' },
  });
  const [createDeal] = useMutation(CreateDealDocument);

  async function onSubmit(values: DealForm): Promise<void> {
    setFormError(null);
    const valueCents = parseReaisToCents(values.value);

    if (valueCents === null) {
      return;
    }

    try {
      await createDeal({
        variables: {
          input: {
            title: values.title.trim(),
            valueCents,
            stage: values.stage,
            contactId,
            companyId: companyId ?? undefined,
            expectedCloseDate: values.expectedCloseDate
              ? `${values.expectedCloseDate}T12:00:00.000Z`
              : undefined,
          },
        },
        refetchQueries: ['DealsByContact', 'DashboardMetrics'],
      });
      reset({ title: '', value: '', stage: 'LEAD', expectedCloseDate: '' });
      onClose();
    } catch (error) {
      const normalized = normalizeApolloError(error);

      setFormError(
        normalized.kind === 'validation' || normalized.kind === 'conflict'
          ? (normalized.message ?? t('common.error'))
          : normalized.kind === 'network'
            ? t('common.networkError')
            : t('common.error'),
      );
    }
  }

  return (
    <Dialog
      open={open}
      title={t('contact.addDeal')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="create-deal-form" busy={isSubmitting}>
            {isSubmitting ? t('contact.dealCreating') : t('contact.dealSubmit')}
          </Button>
        </>
      }
    >
      <form
        id="create-deal-form"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {formError ? (
          <InlineNotice tone="danger" live="assertive">
            {formError}
          </InlineNotice>
        ) : null}

        <TextField
          label={t('contact.dealTitle')}
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('contact.dealValueLabel')}
            inputMode="decimal"
            error={errors.value?.message}
            {...register('value')}
          />

          <SelectField label={t('contact.dealStage')} {...register('stage')}>
            {OPEN_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {t(`stage.${stage}`)}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          label={t('contact.dealExpectedClose')}
          type="date"
          {...register('expectedCloseDate')}
        />
      </form>
    </Dialog>
  );
}
