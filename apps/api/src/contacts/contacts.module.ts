import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContactsResolver } from './contacts.resolver.js';
import { ContactsService } from './contacts.service.js';

@Module({
  imports: [AuthModule],
  providers: [ContactsService, ContactsResolver],
})
export class ContactsModule {}
