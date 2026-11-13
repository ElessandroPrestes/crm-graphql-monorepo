import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { ServerResponse } from 'node:http';

export function rawBodyJsonOptions() {
  return {
    limit: process.env.JSON_BODY_LIMIT ?? '256kb',
    verify: (request: Request, _response: ServerResponse, buffer: Buffer) => {
      (request as RawBodyRequest<Request>).rawBody = buffer;
    },
  };
}
