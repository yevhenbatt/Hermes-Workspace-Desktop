import { GatewayRequestError } from '../../gateway/gatewayClient';

export const formatAgentTaskError = (reason: unknown, taskId: string | null): string => {
  const detail = reason instanceof Error ? reason.message : 'Request failed.';
  if (taskId) return `${detail} Task ${taskId} may still be running; check its status before retrying.`;
  if (reason instanceof GatewayRequestError && [400, 401, 403, 404].includes(reason.status)) {
    return `${detail} The request was rejected by Gateway. Check task history before retrying.`;
  }
  return `${detail} The task may have been created; check Gateway before retrying.`;
};
