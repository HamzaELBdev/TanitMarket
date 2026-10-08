import { collection, doc, addDoc, setDoc, updateDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { buildTicket, buildReply } from '@/lib/support';

const TICKETS = 'supportTickets';
const MESSAGES = 'messages';

function ticketsFrom(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Open a support request (chat or contact form) with its first message.
 * Resolves to { ok: true, id } or { ok: false, error } with a stable code.
 */
export async function createSupportTicket({ topic, channel, message, userName }) {
  const user = auth.currentUser;
  const built = buildTicket({
    topic, channel, message,
    user: { uid: user?.uid, name: userName || user?.displayName || '', email: user?.email || '' },
  });
  if (!built.ok) return built;

  try {
    const ref = doc(collection(db, TICKETS));
    await setDoc(ref, {
      ...built.data,
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await addDoc(collection(db, TICKETS, ref.id, MESSAGES), {
      senderId: user.uid,
      senderRole: 'user',
      senderName: built.data.userName,
      text: built.message,
      createdAt: serverTimestamp(),
    });
    // Same feed the admin dashboard already watches for new listings.
    addDoc(collection(db, 'notifications'), {
      body: `${built.data.userName || built.data.userEmail || 'Un membre'} — ${built.message.slice(0, 80)}`,
      createdAt: new Date().toISOString(),
      link: '/dash',
      read: false,
      title: channel === 'chat' ? 'Nouveau chat support' : 'Nouveau message de contact',
      type: 'support',
      userId: 'admin',
    }).catch(() => {});
    return { ok: true, id: ref.id };
  } catch (err) {
    console.warn('Create support ticket error:', err);
    return { ok: false, error: 'failed' };
  }
}

/** Append a message to a ticket, as the member or as an admin. */
export async function sendSupportMessage(ticketId, { text, role, senderName }) {
  const reply = buildReply(text);
  if (!reply.ok) return reply;
  const user = auth.currentUser;
  if (!user || !ticketId) return { ok: false, error: 'not-signed-in' };
  const isAdmin = role === 'admin';

  try {
    await addDoc(collection(db, TICKETS, ticketId, MESSAGES), {
      senderId: user.uid,
      senderRole: isAdmin ? 'admin' : 'user',
      senderName: String(senderName || user.displayName || '').slice(0, 100),
      text: reply.text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, TICKETS, ticketId), {
      lastMessage: reply.text.slice(0, 200),
      lastMessageTime: serverTimestamp(),
      lastSenderRole: isAdmin ? 'admin' : 'user',
      unreadAdmin: !isAdmin,
      unreadUser: isAdmin,
      status: 'open',
    });
    return { ok: true };
  } catch (err) {
    console.warn('Send support message error:', err);
    return { ok: false, error: 'failed' };
  }
}

/** The member's own requests, newest activity first. */
export function subscribeToMyTickets(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, TICKETS), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(ticketsFrom(snap).sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0))),
    (err) => { console.warn('Support tickets error:', err); callback([]); }
  );
}

/** Admin only: every request, newest activity first. */
export function subscribeToAllTickets(callback) {
  const q = query(collection(db, TICKETS), orderBy('lastMessageTime', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => callback(ticketsFrom(snap)),
    (err) => { console.warn('Support inbox error:', err); callback([]); }
  );
}

export function subscribeToTicketMessages(ticketId, callback) {
  if (!ticketId) { callback([]); return () => {}; }
  const q = query(collection(db, TICKETS, ticketId, MESSAGES), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.warn('Support messages error:', err); callback([]); }
  );
}

/** Clear the unread flag for whoever is looking (best effort). */
export async function markTicketRead(ticketId, role) {
  try {
    await updateDoc(doc(db, TICKETS, ticketId), role === 'admin' ? { unreadAdmin: false } : { unreadUser: false });
  } catch (err) { /* not worth interrupting the reader */ }
}

export async function setTicketStatus(ticketId, status) {
  await updateDoc(doc(db, TICKETS, ticketId), { status: status === 'resolved' ? 'resolved' : 'open' });
}
