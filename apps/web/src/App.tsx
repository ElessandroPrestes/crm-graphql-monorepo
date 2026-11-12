import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoginPage } from './auth/login-page';
import { RequireAuth } from './auth/require-auth';
import { ContactDetailPage } from './contacts/contact-detail-page';
import { ContactsPage } from './contacts/contacts-page';
import { DashboardPage } from './dashboard/dashboard-page';
import { ConversationPage } from './inbox/conversation-page';
import { InboxPage } from './inbox/inbox-page';
import { PipelinePage } from './pipeline/pipeline-page';
import { AppShell, RouteAnnouncer } from './shell/app-shell';
import { NotFoundPage } from './shell/not-found-page';

export function App(): ReactElement {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:contactId" element={<ContactDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="inbox/:conversationId" element={<ConversationPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <RouteAnnouncer />
    </>
  );
}
