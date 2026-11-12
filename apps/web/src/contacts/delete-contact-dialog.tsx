import { useMutation } from '@apollo/client/react';
import { DeleteContactDocument } from '@nexo/graphql-schema/operations';
import { useState, type ReactElement } from 'react';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { InlineNotice } from '../ui/states';
import { fullName } from './contact-utils';

interface DeleteContactDialogProps {
  open: boolean;
  contact: { id: string; firstName: string; lastName: string };
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteContactDialog({
  open,
  contact,
  onClose,
  onDeleted,
}: DeleteContactDialogProps): ReactElement {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [deleteContact, { loading }] = useMutation(DeleteContactDocument);
  const name = fullName(contact);

  async function handleDelete(): Promise<void> {
    setError(null);

    try {
      await deleteContact({
        variables: { id: contact.id },
        refetchQueries: ['ContactsList'],
        awaitRefetchQueries: true,
        update: (cache) => {
          cache.evict({ id: `Contact:${contact.id}` });
          cache.gc();
        },
      });
      onDeleted();
    } catch (mutationError) {
      const normalized = normalizeApolloError(mutationError);

      setError(
        normalized.kind === 'notFound'
          ? t('contact.notFoundDescription')
          : normalized.kind === 'network'
            ? t('common.networkError')
            : t('contact.deleteError'),
      );
    }
  }

  return (
    <Dialog
      open={open}
      title={t('contact.deleteTitle', { name })}
      description={t('contact.deleteDescription')}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" busy={loading} onClick={() => void handleDelete()}>
            {loading ? t('contact.deleting') : t('contact.delete')}
          </Button>
        </>
      }
    >
      {error ? (
        <InlineNotice tone="danger" live="assertive">
          {error}
        </InlineNotice>
      ) : null}
    </Dialog>
  );
}
