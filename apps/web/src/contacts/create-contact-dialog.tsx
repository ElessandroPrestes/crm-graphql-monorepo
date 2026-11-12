import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import { CreateContactDocument } from '@nexo/graphql-schema/operations';
import type { CompaniesListQuery } from '@nexo/graphql-schema/operations';
import { useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { SelectField, TextField } from '../ui/field';
import { InlineNotice } from '../ui/states';

interface CreateContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string;
}

interface CreateContactDialogProps {
  open: boolean;
  companies: CompaniesListQuery['companies']['edges'];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export function CreateContactDialog({
  open,
  companies,
  onClose,
  onCreated,
}: CreateContactDialogProps): ReactElement {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t('contacts.firstNameRequired')),
        lastName: z.string().trim().min(1, t('contacts.lastNameRequired')),
        email: z.union([z.literal(''), z.email(t('contacts.invalidEmail'))]),
        phone: z.string(),
        jobTitle: z.string(),
        companyId: z.string(),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: '',
    },
  });
  const [createContact] = useMutation(CreateContactDocument);

  async function onSubmit(values: CreateContactForm): Promise<void> {
    setFormError(null);

    try {
      await createContact({
        variables: {
          input: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim() || undefined,
            phone: values.phone.trim() || undefined,
            jobTitle: values.jobTitle.trim() || undefined,
            companyId: values.companyId || undefined,
          },
        },
      });
      reset();
      await onCreated();
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
      title={t('contacts.createTitle')}
      description={t('contacts.createDescription')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="create-contact-form"
            busy={isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            {isSubmitting ? t('contacts.creating') : t('contacts.createSubmit')}
          </Button>
        </>
      }
    >
      <form
        id="create-contact-form"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {formError ? (
          <InlineNotice tone="danger" live="assertive">
            {formError}
          </InlineNotice>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('contacts.firstName')}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <TextField
            label={t('contacts.lastName')}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <TextField
          label={t('contacts.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('contacts.phone')}
            type="tel"
            autoComplete="tel"
            {...register('phone')}
          />
          <TextField
            label={t('contacts.jobTitle')}
            autoComplete="organization-title"
            {...register('jobTitle')}
          />
        </div>

        <SelectField label={t('contacts.company')} {...register('companyId')}>
          <option value="">{t('contacts.companyNone')}</option>
          {companies.map(({ node }) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </SelectField>
      </form>
    </Dialog>
  );
}
