import type { MessageKey } from '../i18n/messages';

export function routeTitleKey(pathname: string): MessageKey {
  if (pathname === '/login') {
    return 'login.title';
  }

  if (pathname === '/') {
    return 'dashboard.title';
  }

  if (pathname === '/contacts') {
    return 'contacts.title';
  }

  if (/^\/contacts\/[^/]+\/?$/.test(pathname)) {
    return 'contact.title';
  }

  if (pathname === '/pipeline') {
    return 'pipeline.title';
  }

  if (pathname === '/inbox') {
    return 'inbox.title';
  }

  if (/^\/inbox\/[^/]+\/?$/.test(pathname)) {
    return 'conversation.title';
  }

  return 'notFound.title';
}
