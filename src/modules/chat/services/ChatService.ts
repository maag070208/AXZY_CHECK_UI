import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ChatMessage {
  id: number;
  message: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    lastName?: string | null;
    role?: { name: string; value: string } | null;
  };
}

/** @description Loads chat history, newest first. Pass `cursor` (oldest loaded id) to page back in time. */
export const getMessages = async (cursor?: number, limit = 30): Promise<TResult<ChatMessage[]>> => {
  const query = new URLSearchParams();
  if (cursor) query.set("cursor", String(cursor));
  query.set("limit", String(limit));
  return await get<ChatMessage[]>(`/chat/messages?${query.toString()}`);
};

/** @description Sends a message from the authenticated user. */
export const sendMessage = async (message: string): Promise<TResult<ChatMessage>> => {
  return await post<ChatMessage>("/chat/messages", { message });
};

/** @description Requests a subscribe-only Ably TokenRequest for realtime updates. */
export const getRealtimeToken = async (): Promise<TResult<any>> => {
  return await get<any>("/realtime/token");
};
