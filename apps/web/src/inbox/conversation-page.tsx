import { useMutation, useQuery, useSubscription } from '@apollo/client/react';
import {
  ConversationDetailDocument,
  MessageReceivedDocument,
  MessagesDocument,
  SendMessageDocument,
  type ConversationDetailQuery,
  type MessageReceivedSubscription,
  type MessagesQuery,
  type MessagesQueryVariables,
  type SendMessageMutation,
  type SendMessageMutationVariables,
} from '@nexo/graphql-schema/operations';
import { useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fullName } from '../contacts/contact-utils';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatDateTime } from '../i18n/messages';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, InlineNotice, LoadingState } from '../ui/states';
import { createClientMessageId } from './client-message-id';
import { ConversationListPanel } from './inbox-page';

const PAGE_SIZE = 30;

interface PendingMessage {
  clientMessageId: string;
  body: string;
  status: 'QUEUED' | 'FAILED';
  sentAt: string;
}

export function ConversationPage(): ReactElement {
  const { t } = useI18n();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const conversationQuery = useQuery<ConversationDetailQuery>(ConversationDetailDocument, {
    variables: { id: conversationId ?? '' },
    skip: !conversationId,
    fetchPolicy: 'cache-and-network',
  });
  const messagesQuery = useQuery<MessagesQuery, MessagesQueryVariables>(MessagesDocument, {
    variables: { conversationId: conversationId ?? '', first: PAGE_SIZE },
    skip: !conversationId,
    fetchPolicy: 'cache-and-network',
  });
  const [sendMessage] = useMutation<SendMessageMutation, SendMessageMutationVariables>(
    SendMessageDocument,
  );
  const subscription = useSubscription<MessageReceivedSubscription>(MessageReceivedDocument, {
    variables: { conversationId: conversationId ?? '' },
    skip: !conversationId,
    onData: ({ data }) => {
      const message = data.data?.messageReceived;

      if (!message) {
        return;
      }

      const contact = conversationQuery.data?.conversation.contact;
      setAnnouncement(
        t('conversation.newMessage', {
          name: contact ? fullName(contact) : t('nav.inbox'),
        }),
      );
      void messagesQuery.refetch();
    },
  });

  const conversation = conversationQuery.data?.conversation;
  const contactName = conversation ? fullName(conversation.contact) : '';
  const conversationError = conversationQuery.error
    ? normalizeApolloError(conversationQuery.error)
    : null;
  const messagesError = messagesQuery.error ? normalizeApolloError(messagesQuery.error) : null;
  const edges = messagesQuery.data?.messages.edges ?? [];
  const hasOlder = messagesQuery.data?.messages.pageInfo.hasNextPage ?? false;
  const olderCursor = messagesQuery.data?.messages.pageInfo.endCursor ?? null;
  const serverMessages = [...edges].reverse().map((edge) => edge.node);
  const serverClientIds = new Set(
    serverMessages
      .map((message) => message.clientMessageId)
      .filter((value): value is string => Boolean(value)),
  );
  const visiblePending = pending.filter((message) => !serverClientIds.has(message.clientMessageId));

  async function deliver(clientMessageId: string, body: string): Promise<void> {
    setSending(true);
    setSendError(false);

    try {
      await sendMessage({
        variables: {
          input: { conversationId: conversationId ?? '', text: body, clientMessageId },
        },
      });

      try {
        await messagesQuery.refetch();
        setPending((current) =>
          current.filter((message) => message.clientMessageId !== clientMessageId),
        );
      } catch {
        setPending((current) =>
          current.map((message) =>
            message.clientMessageId === clientMessageId
              ? { ...message, status: 'QUEUED' }
              : message,
          ),
        );
      }
    } catch {
      setPending((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId ? { ...message, status: 'FAILED' } : message,
        ),
      );
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const body = draft.trim();

    if (!body || !conversationId) {
      return;
    }

    const clientMessageId = createClientMessageId();

    setPending((current) => [
      ...current,
      {
        clientMessageId,
        body,
        status: 'QUEUED',
        sentAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
    composerRef.current?.focus();
    void deliver(clientMessageId, body);
  }

  function retry(message: PendingMessage): void {
    setPending((current) =>
      current.map((item) =>
        item.clientMessageId === message.clientMessageId ? { ...item, status: 'QUEUED' } : item,
      ),
    );
    void deliver(message.clientMessageId, message.body);
  }

  async function loadOlder(): Promise<void> {
    if (!olderCursor) {
      return;
    }

    setLoadingOlder(true);

    try {
      await messagesQuery.fetchMore({
        variables: {
          conversationId: conversationId ?? '',
          first: PAGE_SIZE,
          after: olderCursor,
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!previous || !fetchMoreResult) {
            return previous ?? fetchMoreResult;
          }

          const seen = new Set(previous.messages.edges.map((edge) => edge.node.id));
          const older = fetchMoreResult.messages.edges.filter((edge) => !seen.has(edge.node.id));

          return {
            messages: {
              ...fetchMoreResult.messages,
              edges: [...previous.messages.edges, ...older],
            },
          };
        },
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  if (!conversationId) {
    return <EmptyState title={t('conversation.notFound')} description={t('inbox.description')} />;
  }

  if (conversationError?.kind === 'notFound') {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t('conversation.notFound')}</h1>
        <Link to="/inbox" className="text-sm text-[var(--color-primary)]">
          {t('conversation.back')}
        </Link>
      </section>
    );
  }

  if (conversationQuery.loading && !conversation) {
    return <LoadingState label={t('common.loading')} />;
  }

  if (conversationError && !conversation) {
    return (
      <ErrorState
        message={
          conversationError.kind === 'network' ? t('common.networkError') : t('conversation.error')
        }
        onRetry={() => void conversationQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  if (!conversation) {
    return <LoadingState label={t('common.loading')} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <ConversationListPanel activeId={conversation.id} showSearch={false} />
      </aside>

      <section aria-labelledby="conversation-title" className="space-y-4">
        <header className="space-y-2">
          <Link to="/inbox" className="inline-flex text-sm text-[var(--color-primary)] lg:hidden">
            {t('conversation.back')}
          </Link>
          <h1 id="conversation-title" className="text-2xl font-semibold tracking-tight">
            {contactName}
          </h1>
          {conversation.contact.phone ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('conversation.contactPhone')}: {conversation.contact.phone}
            </p>
          ) : null}
        </header>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {subscription.error ? (
          <InlineNotice tone="warning" live="polite">
            {t('conversation.reconnecting')}
          </InlineNotice>
        ) : null}

        {messagesError ? (
          <ErrorState
            message={t('conversation.error')}
            onRetry={() => void messagesQuery.refetch()}
            retryLabel={t('common.retry')}
          />
        ) : null}

        <div className="space-y-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] p-4">
          {hasOlder ? (
            <Button variant="secondary" busy={loadingOlder} onClick={() => void loadOlder()}>
              {loadingOlder ? t('conversation.loadingOlder') : t('conversation.loadOlder')}
            </Button>
          ) : null}

          {messagesQuery.loading && serverMessages.length === 0 ? (
            <LoadingState label={t('conversation.loading')} />
          ) : null}

          {!messagesQuery.loading && serverMessages.length === 0 && visiblePending.length === 0 ? (
            <EmptyState title={t('conversation.empty')} description={t('inbox.description')} />
          ) : (
            <ol className="space-y-3" aria-label={t('conversation.title')}>
              {serverMessages.map((message) => {
                const outbound = message.direction === 'OUTBOUND';

                return (
                  <li
                    key={message.id}
                    className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] space-y-1 rounded-[var(--radius-panel)] border px-3 py-2 text-sm ${
                        outbound
                          ? 'border-[var(--color-primary)] bg-[var(--color-surface-muted)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <span className="sr-only">
                          {outbound ? t('conversation.outbound') : t('conversation.inbound')}
                        </span>
                        <span>{formatDateTime(String(message.sentAt))}</span>
                        <span>{t(`conversation.status.${message.status}`)}</span>
                      </p>
                    </div>
                  </li>
                );
              })}

              {visiblePending.map((message) => (
                <li key={message.clientMessageId} className="flex justify-end">
                  <div className="max-w-[85%] space-y-1 rounded-[var(--radius-panel)] border border-[var(--color-primary)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span>{formatDateTime(message.sentAt)}</span>
                      <span>
                        {message.status === 'FAILED'
                          ? t('conversation.status.FAILED')
                          : t('conversation.status.QUEUED')}
                      </span>
                    </p>
                    {message.status === 'FAILED' ? (
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => retry(message)}
                      >
                        {t('conversation.retry')}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {sendError ? (
          <InlineNotice tone="danger" live="assertive">
            {t('conversation.sendError')}
          </InlineNotice>
        ) : null}

        <form className="space-y-2" onSubmit={handleSubmit}>
          <label htmlFor="conversation-composer" className="block text-sm font-medium">
            {t('conversation.composerLabel')}
          </label>
          <textarea
            id="conversation-composer"
            ref={composerRef}
            value={draft}
            rows={3}
            placeholder={t('conversation.composerPlaceholder')}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          />
          <div className="flex justify-end">
            <Button type="submit" busy={sending} disabled={draft.trim().length === 0}>
              {sending ? t('conversation.sending') : t('conversation.send')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
