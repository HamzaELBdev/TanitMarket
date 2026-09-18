import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

function buildConversationId(productId, uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `${productId}__${a}__${b}`;
}

/**
 * Get (or create, if this is the first contact) the single conversation
 * between a buyer and seller for a given listing.
 */
export async function getOrCreateConversation({
  productId, productTitle, productImage, productPrice,
  buyerId, buyerName, buyerAvatar,
  sellerId, sellerName, sellerAvatar, sellerLocation
}) {
  const conversationId = buildConversationId(productId, buyerId, sellerId);
  const ref = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [buyerId, sellerId],
      buyerId, buyerName: buyerName || 'Acheteur', buyerAvatar: buyerAvatar || '',
      sellerId, sellerName: sellerName || 'Vendeur', sellerAvatar: sellerAvatar || '', sellerLocation: sellerLocation || '',
      productId: String(productId), productTitle: productTitle || '', productImage: productImage || '', productPrice: productPrice ?? '',
      lastMessage: '', lastMessageTime: serverTimestamp(), lastSenderId: '',
      unreadCount: { [buyerId]: 0, [sellerId]: 0 },
      negotiationStatus: 'open', agreedPrice: null,
      createdAt: serverTimestamp()
    });
  }

  return conversationId;
}

function formatRelativeTime(ts) {
  if (!ts?.toDate) return 'À l\'instant';
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function normalizeConversation(id, data, userId) {
  const isBuyer = data.buyerId === userId;
  return {
    id,
    productId: data.productId,
    productTitle: data.productTitle,
    productPrice: data.productPrice,
    productImage: data.productImage,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    // The UI always displays "the other participant" under the sellerName/
    // sellerAvatar/sellerLocation keys, regardless of whether the viewer is
    // the buyer or the seller in this conversation.
    sellerName: isBuyer ? data.sellerName : data.buyerName,
    sellerAvatar: isBuyer ? data.sellerAvatar : data.buyerAvatar,
    sellerLocation: isBuyer ? data.sellerLocation : '',
    unreadCount: (data.unreadCount && data.unreadCount[userId]) || 0,
    lastMessage: data.lastMessage,
    lastMessageTime: formatRelativeTime(data.lastMessageTime),
    negotiationStatus: data.negotiationStatus || 'open',
    agreedPrice: data.agreedPrice ?? null,
    _sortKey: data.lastMessageTime?.toMillis ? data.lastMessageTime.toMillis() : 0
  };
}

/**
 * Real-time list of conversations the given user is part of, newest first.
 */
export function subscribeToUserChats(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, CONVERSATIONS_COLLECTION), where('participants', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((d) => normalizeConversation(d.id, d.data(), userId))
        .sort((a, b) => b._sortKey - a._sortKey);
      callback(items);
    }, () => callback([]));
  } catch (err) {
    callback([]);
    return () => {};
  }
}

/**
 * Real-time messages of one conversation, oldest first.
 */
export function subscribeToConversationMessages(conversationId, callback) {
  if (!conversationId) {
    callback([]);
    return () => {};
  }
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          isOffer: !!data.isOffer,
          offerAmount: data.offerAmount ?? null,
          imageUrl: data.imageUrl ?? null,
          note: data.note ?? null,
          isSystem: !!data.isSystem,
          systemType: data.systemType ?? null,
          timestamp: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : 'À l\'instant'
        };
      });
      callback(items);
    }, () => callback([]));
  } catch (err) {
    callback([]);
    return () => {};
  }
}

/**
 * Append a message to a conversation and update its summary fields (this is
 * also what a Cloud Function listens on to trigger push/email notifications).
 */
export async function sendMessageToConversation(conversationId, { senderId, senderName, text, isOffer = false, offerAmount = null, imageUrl = null, note = null, isSystem = false, systemType = null }) {
  if (!conversationId || !senderId) throw new Error('Conversation ou expéditeur manquant.');

  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) throw new Error('Cette conversation est introuvable.');
  const conv = convSnap.data();
  const recipientId = conv.participants?.find((p) => p !== senderId);

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  await addDoc(messagesRef, {
    senderId,
    senderName: senderName || 'Moi',
    text: text || '',
    isOffer,
    offerAmount,
    imageUrl: imageUrl || null,
    note: note || null,
    isSystem,
    systemType,
    createdAt: serverTimestamp()
  });

  const summaryText = isOffer ? `Offre : ${offerAmount} TND` : (imageUrl ? '📷 Photo' : text);
  await updateDoc(convRef, {
    lastMessage: summaryText,
    lastMessageTime: serverTimestamp(),
    lastSenderId: senderId,
    ...(recipientId ? { [`unreadCount.${recipientId}`]: increment(1) } : {})
  });
}

/**
 * Accept the latest offer: locks the conversation's negotiation (disables
 * further accept/reject on other offers) and records the agreed price. The
 * caller is responsible for also reserving the listing itself.
 */
export async function acceptOfferInConversation(conversationId, { actorId, actorName, amount, text }) {
  if (!conversationId || !actorId) throw new Error('Conversation ou utilisateur manquant.');
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(convRef, { negotiationStatus: 'accepted', agreedPrice: amount });
  await sendMessageToConversation(conversationId, {
    senderId: actorId,
    senderName: actorName,
    text: text || '',
    isSystem: true,
    systemType: 'accepted'
  });
}

/**
 * Reject the latest offer. The negotiation stays open — either side can
 * keep chatting or send a new offer afterwards.
 */
export async function rejectOfferInConversation(conversationId, { actorId, actorName, text }) {
  if (!conversationId || !actorId) throw new Error('Conversation ou utilisateur manquant.');
  await sendMessageToConversation(conversationId, {
    senderId: actorId,
    senderName: actorName,
    text: text || '',
    isSystem: true,
    systemType: 'rejected'
  });
}

/**
 * Reset the unread counter for a user opening a conversation.
 */
export async function markConversationRead(conversationId, userId) {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(convRef, { [`unreadCount.${userId}`]: 0 });
  } catch (err) {}
}
