import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  decodeCursor,
  encodeCursor,
  pageSize,
  toConnection,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './pagination.js';

describe('pagination', () => {
  it('encodes and decodes a cursor', () => {
    const createdAt = new Date('2026-11-09T12:00:00.000Z');
    const cursor = encodeCursor(createdAt, '11111111-1111-4111-8111-111111111111');

    expect(decodeCursor(cursor)).toEqual({
      createdAt: createdAt.toISOString(),
      id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('rejects an invalid cursor', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(BadRequestException);
  });

  it('uses the default page size and rejects invalid sizes', () => {
    expect(pageSize()).toBe(DEFAULT_PAGE_SIZE);
    expect(pageSize(10)).toBe(10);
    expect(() => pageSize(0)).toThrow(BadRequestException);
    expect(() => pageSize(MAX_PAGE_SIZE + 1)).toThrow(BadRequestException);
    expect(() => pageSize(1.5)).toThrow(BadRequestException);
  });

  it('builds a connection and reports the next page', () => {
    const rows = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        createdAt: new Date('2026-11-09T12:00:03.000Z'),
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        createdAt: new Date('2026-11-09T12:00:02.000Z'),
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        createdAt: new Date('2026-11-09T12:00:01.000Z'),
      },
    ];

    const connection = toConnection(rows, 2);

    expect(connection.edges).toHaveLength(2);
    expect(connection.pageInfo.hasNextPage).toBe(true);
    expect(connection.pageInfo.endCursor).toBe(encodeCursor(rows[1]!.createdAt, rows[1]!.id));
  });
});
