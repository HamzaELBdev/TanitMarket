"use client";
import { buildAppointment, appointmentSummary, replySummary, readAppointment } from '@/lib/appointment';
import { buildTrade, tradeSummary, tradeReplySummary, readTrade } from '@/lib/trade';
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
import { resolveUserAvatar } from '@/lib/avatar';
import { resolveListingContactId } from '@/lib/listingContact';

export function useChat(initialProductId = null) {
  const { user, userProfile } = useAuth();
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

        // Not necessarily prod.sellerId: a listing an admin published on
        // someone's behalf carries a synthetic id that matches no account, and
        // the conversation goes to the admin who posted it instead.
        const contactId = resolveListingContactId(prod);
        if (!contactId) {
          if (isMounted) setError("Impossible de contacter le vendeur de cette annonce (vendeur introuvable).");
          return;
        }
        if (contactId === user.uid) return; // seller clicking their own listing's chat link

        const conversationId = await getOrCreateConversation({
          productId: String(prod.id),
          productTitle: prod.title,
          productImage: prod.image || prod.images?.[0] || '',
          productPrice: prod.price,
          buyerId: user.uid,
          buyerName: user.displayName || (user.email ? user.email.split('@')[0] : 'Acheteur'),
          buyerAvatar: resolveUserAvatar(userProfile, user) || '',
          sellerId: contactId,
          // The name stays the one shown on the listing: the buyer is
          // answering an ad by "X", and should not suddenly see an admin's
          // name as their counterpart.
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

  // A ?productId= link opened by the seller (older notifications used them):
  // there is no conversation to create, so open the newest one for that
  // listing among the user's own. Threads only ever hold the user's chats.
  useEffect(() => {
    if (!initialProductId || activeThreadId || threads.length === 0) return;
    const match = threads.find((th) => String(th.productId) === String(initialProductId));
    if (match) setActiveThreadId(match.id);
  }, [initialProductId, activeThreadId, threads]);

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

  const myName = () => user?.displayName || (user?.email ? user.email.split('@')[0] : 'Moi');

  // Resolves to { ok: true } or { ok: false, error } with a code from
  // lib/appointment.js that the page turns into a message.
  const proposeAppointment = async ({ at, place }) => {
    if (!activeThreadId || !user?.uid) return { ok: false, error: 'failed' };
    const built = buildAppointment({ at, place });
    if (!built.ok) return built;
    try {
      await sendMessageToConversation(activeThreadId, {
        senderId: user.uid,
        senderName: myName(),
        text: appointmentSummary(built.data),
        appointment: built.data
      });
      setError(null);
      return { ok: true };
    } catch (err) {
      console.warn('Propose appointment error:', err);
      setError("Échec de l'envoi du rendez-vous. Vérifiez votre connexion et réessayez.");
      return { ok: false, error: 'failed' };
    }
  };

  // `answer` is 'confirm' | 'decline' | 'cancel'. The answer is a new message
  // (messages are append-only); the proposal's state is derived from it.
  const answerAppointment = async (proposal, answer) => {
    const appt = readAppointment(proposal);
    if (!appt || !activeThreadId || !user?.uid) return false;
    try {
      await sendMessageToConversation(activeThreadId, {
        senderId: user.uid,
        senderName: myName(),
        text: replySummary(answer, appt),
        isSystem: true,
        systemType: `appointment_${answer}`,
        appointmentReply: { to: proposal.id, answer }
      });
      setError(null);
      return true;
    } catch (err) {
      console.warn('Answer appointment error:', err);
      setError("Échec de l'envoi de la réponse. Vérifiez votre connexion et réessayez.");
      return false;
    }
  };

  // `offered` is one of the user's own listings. Resolves to { ok: true } or
  // { ok: false, error } with a code from lib/trade.js.
  const proposeTrade = async ({ offered, cash }) => {
    if (!activeThreadId || !user?.uid) return { ok: false, error: 'failed' };
    const built = buildTrade({ offered, cash, uid: user.uid, targetListingId: activeThreadMeta?.productId });
    if (!built.ok) return built;
    try {
      await sendMessageToConversation(activeThreadId, {
        senderId: user.uid,
        senderName: myName(),
        text: tradeSummary(built.data),
        trade: built.data
      });
      setError(null);
      return { ok: true };
    } catch (err) {
      console.warn('Propose trade error:', err);
      setError("Échec de l'envoi de la proposition. Vérifiez votre connexion et réessayez.");
      return { ok: false, error: 'failed' };
    }
  };

  // `answer` is 'accept' | 'decline' | 'withdraw'; like appointments, it is a
  // new message and the proposal's state is derived from it.
  const answerTrade = async (proposal, answer) => {
    const trade = readTrade(proposal);
    if (!trade || !activeThreadId || !user?.uid) return false;
    try {
      await sendMessageToConversation(activeThreadId, {
        senderId: user.uid,
        senderName: myName(),
        text: tradeReplySummary(answer, trade),
        isSystem: true,
        systemType: `trade_${answer}`,
        tradeReply: { to: proposal.id, answer }
      });
      setError(null);
      return true;
    } catch (err) {
      console.warn('Answer trade error:', err);
      setError("Échec de l'envoi de la réponse. Vérifiez votre connexion et réessayez.");
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
    proposeAppointment,
    answerAppointment,
    proposeTrade,
    answerTrade,
    loading,
    error
  };
}
