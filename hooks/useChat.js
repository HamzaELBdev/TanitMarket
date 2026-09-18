"use client";
import { useState, useEffect } from 'react';
import {
  subscribeToUserChats,
  subscribeToConversationMessages,
  sendMessageToConversation,
  getOrCreateConversation,
  markConversationRead,
  acceptOfferInConversation,
  rejectOfferInConversation
} from '@/lib/services/chatService';
import { fetchProductById } from '@/lib/services/listingsService';
import { useAuth } from './useAuth';

export function useChat(initialProductId = null) {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real-time list of this user's conversations
  useEffect(() => {
    if (!user?.uid) {
      setThreads([]);
      return;
    }
    const unsub = subscribeToUserChats(user.uid, setThreads);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid]);

  // Auto open/create the conversation for ?productId=xxx
  useEffect(() => {
    if (!initialProductId || !user?.uid) return;
    let isMounted = true;

    async function initProductThread() {
      setLoading(true);
      setError(null);
      try {
        const prod = await fetchProductById(initialProductId);
        if (!isMounted || !prod) return;

        const sellerId = prod.sellerId || prod.seller?.id;
        if (!sellerId) {
          if (isMounted) setError("Impossible de contacter le vendeur de cette annonce (vendeur introuvable).");
          return;
        }
        if (sellerId === user.uid) return; // seller clicking their own listing's chat link

        const conversationId = await getOrCreateConversation({
          productId: String(prod.id),
          productTitle: prod.title,
          productImage: prod.image || prod.images?.[0] || '',
          productPrice: prod.price,
          buyerId: user.uid,
          buyerName: user.displayName || (user.email ? user.email.split('@')[0] : 'Acheteur'),
          buyerAvatar: user.photoURL || '',
          sellerId,
          sellerName: prod.seller?.name || 'Vendeur TanitMarket',
          sellerAvatar: prod.seller?.avatar || '',
          sellerLocation: prod.seller?.location || prod.location || 'Tunis'
        });

        if (isMounted) setActiveThreadId(conversationId);
      } catch (err) {
        console.warn('Init product thread error:', err);
        if (isMounted) setError("Impossible d'ouvrir cette discussion. Vérifiez votre connexion et réessayez.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initProductThread();
    return () => {
      isMounted = false;
    };
  }, [initialProductId, user?.uid]);

  // Default to the most recent thread when landing on /chat with no productId
  useEffect(() => {
    if (!initialProductId && !activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [initialProductId, activeThreadId, threads]);

  // Real-time messages of the active conversation, and mark it read
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToConversationMessages(activeThreadId, setMessages);
    if (user?.uid) markConversationRead(activeThreadId, user.uid);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [activeThreadId, user?.uid]);

  const activeThreadMeta = threads.find((t) => t.id === activeThreadId);
  const activeThread = activeThreadId
    ? {
        id: activeThreadId,
        productId: activeThreadMeta?.productId,
        productTitle: activeThreadMeta?.productTitle,
        productPrice: activeThreadMeta?.productPrice,
        productImage: activeThreadMeta?.productImage,
        sellerName: activeThreadMeta?.sellerName,
        sellerAvatar: activeThreadMeta?.sellerAvatar,
        sellerLocation: activeThreadMeta?.sellerLocation,
        negotiationStatus: activeThreadMeta?.negotiationStatus || 'open',
        agreedPrice: activeThreadMeta?.agreedPrice ?? null,
        messages
      }
    : null;

  const sendMessage = async (text, isOffer = false, offerAmount = null, imageUrl = null, note = null) => {
    if (!text?.trim() && !isOffer && !imageUrl) return false;
    if (!activeThreadId || !user?.uid) return false;

    try {
      await sendMessageToConversation(activeThreadId, {
        senderId: user.uid,
        senderName: user.displayName || (user.email ? user.email.split('@')[0] : 'Moi'),
        text: text?.trim() || '',
        isOffer,
        offerAmount,
        imageUrl,
        note: note?.trim() || null
      });
      setError(null);
      return true;
    } catch (err) {
      console.warn('Send message error:', err);
      setError("Échec de l'envoi du message. Vérifiez votre connexion et réessayez.");
      return false;
    }
  };

  const acceptOffer = async (amount, text) => {
    if (!activeThreadId || !user?.uid) return false;
    try {
      await acceptOfferInConversation(activeThreadId, {
        actorId: user.uid,
        actorName: user.displayName || (user.email ? user.email.split('@')[0] : 'Moi'),
        amount,
        text
      });
      setError(null);
      return true;
    } catch (err) {
      console.warn('Accept offer error:', err);
      setError("Échec de l'acceptation de l'offre. Vérifiez votre connexion et réessayez.");
      return false;
    }
  };

  const rejectOffer = async (text) => {
    if (!activeThreadId || !user?.uid) return false;
    try {
      await rejectOfferInConversation(activeThreadId, {
        actorId: user.uid,
        actorName: user.displayName || (user.email ? user.email.split('@')[0] : 'Moi'),
        text
      });
      setError(null);
      return true;
    } catch (err) {
      console.warn('Reject offer error:', err);
      setError("Échec du refus de l'offre. Vérifiez votre connexion et réessayez.");
      return false;
    }
  };

  return {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    sendMessage,
    acceptOffer,
    rejectOffer,
    loading,
    error
  };
}
