import { describe, expect, it } from 'vitest';
import { GatewayRequestError } from '../../gateway/gatewayClient';
import { formatAgentTaskError } from './agentTaskError';

describe('task error messages', () => {
  it('distinguishes rejected authentication and permission requests', () => {
    for (const status of [400, 401, 403, 404]) {
      expect(formatAgentTaskError(new GatewayRequestError(status, 'Denied'), null)).toContain('rejected by Gateway');
    }
  });
  it('warns that a failed submission may have created a task', () => {
    expect(formatAgentTaskError(new TypeError('Network failure'), null)).toContain('may have been created');
    expect(formatAgentTaskError(new GatewayRequestError(503, 'Unavailable'), null)).toContain('may have been created');
  });
  it('preserves the existing task identifier when status polling fails', () => {
    expect(formatAgentTaskError(new Error('Timeout'), 'task-id')).toContain('Task task-id may still be running');
  });
  it('uses a fallback for non-error failures', () => {
    expect(formatAgentTaskError(null, null)).toContain('Request failed.');
  });
});
