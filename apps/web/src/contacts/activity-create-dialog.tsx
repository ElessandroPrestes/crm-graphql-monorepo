import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { CreateActivityDocument, type ActivityType } from '@nexo/graphql-schema/operations';
import { useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { SelectField, TextAreaField, TextField } from '../ui/field';
import { InlineNotice } from '../ui/states';

const activityTypes: ActivityType[] = ['CALL', 'EMAIL', 'MEETING', 'NOTE'];

interface ActivityForm {
  type: ActivityType;
  subject: string;
  notes: string;
  occurredAt: string;
}

interface ActivityCreateDialogProps {
  open: boolean;
  contactId: string;
  onClose: () => void;
}

function nowForInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function ActivityCreateDialog({
  open,
  contactId,
  onClose,
}: ActivityCreateDialogProps): ReactElement {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE']),
        subject: z.string().trim().min(1, t('contact.activitySubjectRequired')),
        notes: z.string(),
        occurredAt: z.string().min(1, t('common.required')),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CALL', subject: '', notes: '', occurredAt: nowForInput() },
  });
  const [createActivity] = useMutation(CreateActivityDocument);

  async function onSubmit(values: ActivityForm): Promise<void> {
    setFormError(null);

    try {
      await createActivity({
        variables: {
          input: {
            contactId,
            type: values.type,
            subject: values.subject.trim(),
            notes: values.notes.trim() || undefined,
            occurredAt: new Date(values.occurredAt).toISOString(),
          },
        },
        refetchQueries: ['ActivitiesByContact', 'DashboardMetrics'],
      });
      reset({ type: 'CALL', subject: '', notes: '', occurredAt: nowForInput() });
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
      title={t('contact.addActivity')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="create-activity-form" busy={isSubmitting}>
            {isSubmitting ? t('contact.activityCreating') : t('contact.activitySubmit')}
          </Button>
        </>
      }
    >
      <form
        id="create-activity-form"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {formError ? (
          <InlineNotice tone="danger" live="assertive">
            {formError}
          </InlineNotice>
        ) : null}

        <SelectField
          label={t('contact.activityType')}
          error={errors.type?.message}
          {...register('type')}
        >
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {t(`activity.type.${type}`)}
            </option>
          ))}
        </SelectField>

        <TextField
          label={t('contact.activitySubject')}
          error={errors.subject?.message}
          {...register('subject')}
        />

        <TextField
          label={t('contact.activityOccurredAt')}
          type="datetime-local"
          error={errors.occurredAt?.message}
          {...register('occurredAt')}
        />

        <TextAreaField label={t('contact.activityNotes')} {...register('notes')} />
      </form>
    </Dialog>
  );
}
