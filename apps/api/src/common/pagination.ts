import { BadRequestException } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

export interface Cursor {
  createdAt: string;
  id: string;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), 'utf8').toString(
    'base64url',
  );
}

export function decodeCursor(cursor: string): Cursor {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const parsed = cursorSchema.safeParse(decoded);

    if (!parsed.success) {
      throw new BadRequestException('Cursor inválido');
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException('Cursor inválido');
  }
}

export function pageSize(first?: number): number {
  if (first === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  if (!Number.isInteger(first) || first < 1) {
    throw new BadRequestException('first deve ser um inteiro positivo');
  }

  if (first > MAX_PAGE_SIZE) {
    throw new BadRequestException(`first não pode exceder ${MAX_PAGE_SIZE}`);
  }

  return first;
}

export function toConnection<T extends { id: string; createdAt: Date }>(
  rows: T[],
  size: number,
): Connection<T> {
  const hasNextPage = rows.length > size;
  const items = hasNextPage ? rows.slice(0, size) : rows;
  const edges = items.map((node) => ({
    node,
    cursor: encodeCursor(node.createdAt, node.id),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.at(-1)?.cursor ?? null,
    },
  };
}

const timestampCursorSchema = z.object({
  timestamp: z.string().datetime(),
  id: z.string().uuid(),
});

export interface TimestampCursor {
  timestamp: string;
  id: string;
}

export function encodeTimestampCursor(timestamp: Date, id: string): string {
  return Buffer.from(JSON.stringify({ timestamp: timestamp.toISOString(), id }), 'utf8').toString(
    'base64url',
  );
}

export function decodeTimestampCursor(cursor: string): TimestampCursor {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const parsed = timestampCursorSchema.safeParse(decoded);

    if (!parsed.success) {
      throw new BadRequestException('Cursor inválido');
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException('Cursor inválido');
  }
}

export function toTimestampConnection<T extends { id: string }>(
  rows: T[],
  size: number,
  timestamp: (row: T) => Date,
): Connection<T> {
  const hasNextPage = rows.length > size;
  const items = hasNextPage ? rows.slice(0, size) : rows;
  const edges = items.map((node) => ({
    node,
    cursor: encodeTimestampCursor(timestamp(node), node.id),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.at(-1)?.cursor ?? null,
    },
  };
}

export interface PaginationArgs {
  first?: number;
  after?: string;
}

@ObjectType()
export class PageInfoType implements PageInfo {
  @Field()
  hasNextPage!: boolean;

  @Field(() => String, { nullable: true })
  endCursor!: string | null;
}
