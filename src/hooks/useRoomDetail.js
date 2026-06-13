/**
 * useRoomDetail.js
 * Consolidates room doc, members, and messages subscriptions for the detail view.
 * Replaces useRoom, useRoomMembers, and useRoomMessages.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToRoom,
  subscribeToRoomMembers,
  subscribeToMessages,
  subscribeToSharedDocuments,
  sendMessage as sendMsg,
} from '../services/roomService';

/**
 * @param {string | undefined} roomId
 * @returns {{
 *   room:            object | null,
 *   members:         Array<{ id: string, name: string, isHost: boolean, isOnline: boolean }>,
 *   messages:        Array<{ id: string, sender: string, text: string, timestamp: Date }>,
 *   sharedDocuments: Array<object>,
 *   sendMessage:     (text: string, user: object) => Promise<void>,
 *   loading:         boolean,
 *   error:           Error | null,
 * }}
 */
export function useRoomDetail(roomId) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let roomLoaded = false;
    let membersLoaded = false;
    let messagesLoaded = false;
    let docsLoaded = false;

    const checkLoading = () => {
      if (roomLoaded && membersLoaded && messagesLoaded && docsLoaded) setLoading(false);
    };

    const unsubs = [
      subscribeToRoom(
        roomId,
        (snapshot) => {
          setRoom(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
          roomLoaded = true;
          checkLoading();
        },
        (err) => { setError(err); setLoading(false); }
      ),

      subscribeToRoomMembers(
        roomId,
        (snapshot) => {
          setMembers(snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id:       doc.id,
              name:     data.displayName || doc.id,
              isHost:   data.role === 'owner',
              isOnline: false,
            };
          }));
          membersLoaded = true;
          checkLoading();
        },
        (err) => { console.error('Members error:', err); membersLoaded = true; checkLoading(); }
      ),

      subscribeToMessages(
        roomId,
        (snapshot) => {
          setMessages(snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id:        doc.id,
              sender:    data.displayName || data.senderName || data.uid || data.senderId || 'Unknown',
              text:      data.text,
              timestamp: data.createdAt?.toDate() ?? new Date(),
              type:      data.type || 'user',
            };
          }));
          messagesLoaded = true;
          checkLoading();
        },
        (err) => { console.error('Messages error:', err); messagesLoaded = true; checkLoading(); }
      ),

      subscribeToSharedDocuments(
        roomId,
        (snapshot) => {
          setSharedDocuments(snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id:           d.id,
              fileName:     data.fileName,
              fileType:     data.fileType,
              fileSize:     data.fileSize,
              storageUrl:   data.storageUrl,
              uploaderName: data.uploaderName || "Anonymous",
              uploadedAt:   data.uploadedAt?.toDate() ?? new Date(),
              status:       data.status,
              sourceDocId:  data.sourceDocId || null,
              storagePath:  data.storagePath,
            };
          }));
          docsLoaded = true;
          checkLoading();
        },
        (err) => { console.error('Shared documents error:', err); docsLoaded = true; checkLoading(); }
      ),
    ];

    return () => unsubs.forEach((fn) => fn && fn());
  }, [roomId]);

  const sendMessage = useCallback(async (text, user) => {
    if (!text.trim() || !roomId || !user) return;
    await sendMsg(roomId, {
      text:        text.trim(),
      uid:         user.uid,
      displayName: user.displayName || user.email || user.uid,
    });
  }, [roomId]);

  return { room, members, messages, sharedDocuments, sendMessage, loading, error };
}
