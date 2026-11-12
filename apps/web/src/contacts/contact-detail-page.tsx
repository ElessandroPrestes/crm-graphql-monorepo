import { useMutation, useQuery } from '@apollo/client/react';
import {
  ActivitiesByContactDocument,
  ContactDetailDocument,
  ConversationsByContactDocument,
  DealsByContactDocument,
  ExportContactDataDocument,
  type ActivitiesByContactQuery,
  type ContactDetailQuery,
  type ConversationsByContactQuery,
  type DealsByContactQuery,
  type ExportContactDataMutation,
  type ExportContactDataMutationVariables,
} from '@nexo/graphql-schema/operations';
import { useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatCurrencyFromCents, formatDate, formatDateTime } from '../i18n/messages';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, InlineNotice, LoadingState } from '../ui/states';
import { ActivityCreateDialog } from './activity-create-dialog';
import { fullName, stageTone } from './contact-utils';
import { DealCreateDialog } from './deal-create-dialog';
import { DeleteContactDialog } from './delete-contact-dialog';
import { downloadJson } from './download-json';

function asDate(value: unknown): string {
  return String(value);
}

export function ContactDetailPage(): ReactElement {
  const { t } = useI18n();
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [activityOpen, setActivityOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const contactQuery = useQuery<ContactDetailQuery>(ContactDetailDocument, {
    variables: { id: contactId ?? '' },
    skip: !contactId,
    fetchPolicy: 'cache-and-network',
  });
  const contact = contactQuery.data?.contact;
  const contactReady = Boolean(contact);
  const dealsQuery = useQuery<DealsByContactQuery>(DealsByContactDocument, {
    variables: { contactId: contactId ?? '', first: 50 },
    skip: !contactReady || !contactId,
  });
  const activitiesQuery = useQuery<ActivitiesByContactQuery>(ActivitiesByContactDocument, {
    variables: { contactId: contactId ?? '', first: 50 },
    skip: !contactReady || !contactId,
  });
  const conversationsQuery = useQuery<ConversationsByContactQuery>(ConversationsByContactDocument, {
    variables: { contactId: contactId ?? '', first: 50 },
    skip: !contactReady || !contactId,
  });
  const [exportContact, { loading: exporting }] = useMutation<
    ExportContactDataMutation,
    ExportContactDataMutationVariables
  >(ExportContactDataDocument);

  const contactError = contactQuery.error ? normalizeApolloError(contactQuery.error) : null;

  async function handleExport(): Promise<void> {
    if (!contact) {
      return;
    }

    setExportError(null);
    setExported(false);

    try {
      const result = await exportContact({ variables: { id: contact.id } });

      if (!result.data?.exportContactData) {
        throw new Error('Exportação vazia');
      }

      downloadJson(`contato-${contact.id}.json`, result.data.exportContactData);
      setExported(true);
    } catch (error) {
      const normalized = normalizeApolloError(error);

      setExportError(
        normalized.kind === 'network' ? t('common.networkError') : t('contact.exportError'),
      );
    }
  }

  if (!contactId) {
    return (
      <section aria-labelledby="page-title" className="space-y-4">
        <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
          {t('contact.notFoundTitle')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('contact.notFoundDescription')}</p>
        <Link
          to="/contacts"
          className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-on-primary)]"
        >
          {t('common.back')}
        </Link>
      </section>
    );
  }

  if (contactQuery.loading && !contact) {
    return <LoadingState label={t('contact.loading')} />;
  }

  if (contactError?.kind === 'notFound' || (!contactQuery.loading && !contact)) {
    return (
      <section aria-labelledby="page-title" className="space-y-4">
        <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
          {t('contact.notFoundTitle')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('contact.notFoundDescription')}</p>
        <Link
          to="/contacts"
          className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-on-primary)]"
        >
          {t('contacts.title')}
        </Link>
      </section>
    );
  }

  if (contactError && !contact) {
    return (
      <ErrorState
        message={contactError.kind === 'network' ? t('common.networkError') : t('contact.error')}
        onRetry={() => void contactQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  if (!contact) {
    return <LoadingState label={t('contact.loading')} />;
  }

  const name = fullName(contact);
  const deals = dealsQuery.data?.deals.edges ?? [];
  const activities = activitiesQuery.data?.activities.edges ?? [];
  const conversations = conversationsQuery.data?.conversations.edges ?? [];

  return (
    <section aria-labelledby="page-title" className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-[var(--color-text-muted)]">{t('contact.title')}</p>
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
            {name}
          </h1>
          {contact.jobTitle ? (
            <p className="text-[var(--color-text-muted)]">{contact.jobTitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" busy={exporting} onClick={() => void handleExport()}>
            {exporting ? t('contact.exporting') : t('contact.export')}
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            {t('contact.delete')}
          </Button>
        </div>
      </header>

      {exported ? <InlineNotice tone="success">{t('contact.exportSuccess')}</InlineNotice> : null}
      {exportError ? (
        <InlineNotice tone="danger" live="assertive">
          {exportError}
        </InlineNotice>
      ) : null}

      <section aria-labelledby="contact-profile-title" className="space-y-3">
        <h2 id="contact-profile-title" className="text-xl font-semibold">
          {t('contact.profile')}
        </h2>
        <dl className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contacts.email')}
            </dt>
            <dd className="text-sm">{contact.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contacts.phone')}
            </dt>
            <dd className="text-sm">{contact.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contact.company')}
            </dt>
            <dd className="text-sm">{contact.company?.name ?? t('contact.noCompany')}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contacts.jobTitle')}
            </dt>
            <dd className="text-sm">{contact.jobTitle ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contact.createdAt')}
            </dt>
            <dd className="text-sm">{formatDateTime(asDate(contact.createdAt))}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('contact.updatedAt')}
            </dt>
            <dd className="text-sm">{formatDateTime(asDate(contact.updatedAt))}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="contact-deals-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="contact-deals-title" className="text-xl font-semibold">
            {t('contact.deals')}
          </h2>
          <div className="flex gap-2">
            <Link
              to={`/pipeline?contactId=${contact.id}`}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
            >
              {t('contact.viewPipeline')}
            </Link>
            <Button onClick={() => setDealOpen(true)}>{t('contact.addDeal')}</Button>
          </div>
        </div>

        {dealsQuery.error ? (
          <ErrorState
            message={t('common.error')}
            onRetry={() => void dealsQuery.refetch()}
            retryLabel={t('common.retry')}
          />
        ) : dealsQuery.loading && deals.length === 0 ? (
          <LoadingState label={t('common.loading')} />
        ) : deals.length === 0 ? (
          <EmptyState
            title={t('contact.noDeals')}
            description={t('contact.addDeal')}
            action={<Button onClick={() => setDealOpen(true)}>{t('contact.addDeal')}</Button>}
          />
        ) : (
          <ul className="space-y-2">
            {deals.map(({ node }) => (
              <li
                key={node.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3"
              >
                <div className="space-y-1">
                  <p className="font-medium">{node.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {node.expectedCloseDate
                      ? `${t('contact.dealCloseDate')}: ${formatDate(asDate(node.expectedCloseDate))}`
                      : t('contact.noCloseDate')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatCurrencyFromCents(node.valueCents)}
                  </span>
                  <Badge tone={stageTone(node.stage)}>{t(`stage.${node.stage}`)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="contact-activities-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="contact-activities-title" className="text-xl font-semibold">
            {t('contact.activities')}
          </h2>
          <Button variant="secondary" onClick={() => setActivityOpen(true)}>
            {t('contact.addActivity')}
          </Button>
        </div>

        {activitiesQuery.error ? (
          <ErrorState
            message={t('common.error')}
            onRetry={() => void activitiesQuery.refetch()}
            retryLabel={t('common.retry')}
          />
        ) : activitiesQuery.loading && activities.length === 0 ? (
          <LoadingState label={t('common.loading')} />
        ) : activities.length === 0 ? (
          <EmptyState
            title={t('contact.noActivities')}
            description={t('contact.addActivity')}
            action={
              <Button onClick={() => setActivityOpen(true)}>{t('contact.addActivity')}</Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {activities.map(({ node }) => (
              <li
                key={node.id}
                className="space-y-1 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{node.subject}</p>
                  <Badge tone="neutral">{t(`activity.type.${node.type}`)}</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatDateTime(asDate(node.occurredAt))}
                </p>
                {node.notes ? <p className="text-sm">{node.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="contact-conversations-title" className="space-y-3">
        <h2 id="contact-conversations-title" className="text-xl font-semibold">
          {t('contact.conversations')}
        </h2>

        {conversationsQuery.error ? (
          <ErrorState
            message={t('common.error')}
            onRetry={() => void conversationsQuery.refetch()}
            retryLabel={t('common.retry')}
          />
        ) : conversationsQuery.loading && conversations.length === 0 ? (
          <LoadingState label={t('common.loading')} />
        ) : conversations.length === 0 ? (
          <EmptyState
            title={t('contact.noConversations')}
            description={t('inbox.description')}
            action={
              <Link
                to="/inbox"
                className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-on-primary)]"
              >
                {t('nav.inbox')}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {conversations.map(({ node }) => (
              <li key={node.id}>
                <Link
                  to={`/inbox/${node.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm hover:bg-[var(--color-surface-muted)]"
                >
                  <span>{t('contact.openConversation')}</span>
                  <span className="text-[var(--color-text-muted)]">
                    {formatDateTime(asDate(node.lastMessageAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityCreateDialog
        open={activityOpen}
        contactId={contact.id}
        onClose={() => setActivityOpen(false)}
      />
      <DealCreateDialog
        open={dealOpen}
        contactId={contact.id}
        companyId={contact.companyId}
        onClose={() => setDealOpen(false)}
      />
      <DeleteContactDialog
        open={deleteOpen}
        contact={contact}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/contacts')}
      />
    </section>
  );
}
