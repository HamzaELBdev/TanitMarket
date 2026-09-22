"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  XCircle,
  Tag,
  ArrowLeft,
  List,
  Lock,
  Image as ImageIcon,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { uploadImageToStorage } from '@/lib/services/storageService';
import { updateListingStatusInDb } from '@/lib/services/listingsService';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/swal';

function ChatContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const messagesEndRef = useRef(null);

  const initialProductId = searchParams?.get('productId');
  const initialConversationId = searchParams?.get('id');
  const initialOffer = searchParams?.get('offer');
  const initialNote = searchParams?.get('note');

  const {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    sendMessage,
    acceptOffer,
    rejectOffer,
    error: chatError
  } = useChat(initialProductId);

  // Support direct links to an existing conversation (e.g. from the profile page)
  useEffect(() => {
    if (initialConversationId && threads.some((t) => t.id === initialConversationId)) {
      setActiveThreadId(initialConversationId);
    }
  }, [initialConversationId, threads]);

  const [inputMessage, setInputMessage] = useState('');
  const [offerInput, setOfferInput] = useState('');
  const [showCounterBox, setShowCounterBox] = useState(false);
  const [mobileView, setMobileView] = useState('chat');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle initial offer & note from query params once
  const initialProcessed = useRef(false);
  useEffect(() => {
    if (!initialProcessed.current && initialOffer && activeThread) {
      initialProcessed.current = true;
      sendMessage(
        t('chatOfferMessage', { amount: initialOffer }),
        true,
        parseFloat(initialOffer),
        null,
        initialNote
      );
    }
  }, [initialOffer, initialNote, activeThread]);

  // Auto-scroll to bottom of messages timeline
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadId, activeThread?.messages?.length]);

  // Surface chat send/receive errors as a toast
  useEffect(() => {
    if (chatError) showToast(chatError, 'error');
  }, [chatError]);

  if (authLoading) {
    return (
      <div className="h-dvh flex items-center justify-center text-xs font-bold text-[#868685]">
        {t('chatCheckingAccess')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center p-4 bg-gradient-to-b from-[#f4f6f2] to-[#e2e7dd]">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body">
          <div className="w-16 h-16 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
            <Lock className="w-8 h-8 text-[#0e0f0c]" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">{t('chatPrivateTitle')}</h2>
          <p className="text-xs text-[#868685]">{t('chatLoginRequired')}</p>
          <Button href="/auth" variant="primary" size="md">
            {t('favLoginBtn')}
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage;
    setInputMessage('');
    const ok = await sendMessage(text);
    if (!ok) setInputMessage(text);
  };

  const handleChatImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageToStorage(file, 'chats', user?.uid);
      if (uploadedUrl) {
        await sendMessage('', false, null, uploadedUrl);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendCounterOffer = async (e) => {
    e.preventDefault();
    if (!offerInput || isNaN(offerInput)) return;
    const amount = parseFloat(offerInput);
    const ok = await sendMessage(t('chatCounterOfferMessage', { amount }), true, amount);
    if (ok) {
      setOfferInput('');
      setShowCounterBox(false);
    }
  };

  const handleAcceptOffer = async (amount) => {
    const ok = await acceptOffer(amount, t('negDealAcceptedMsg', { amount }));
    if (ok && activeThread?.productId) {
      // Withdraw the listing from the public marketplace now that a price
      // was agreed — best-effort: the negotiation itself already succeeded
      // even if this secondary update fails (e.g. a stale/mock listing id).
      updateListingStatusInDb(activeThread.productId, 'reserved').catch(() => {});
    }
  };

  const handleRejectOffer = async () => {
    await rejectOffer(t('negDealRejectedMsg'));
  };

  const totalUnread = threads.reduce((acc, th) => acc + (th.unreadCount || 0), 0);
  const otherName = activeThread?.sellerName || activeThread?.otherUser?.name || t('chatDefaultSeller');
  const otherAvatar = activeThread?.sellerAvatar;
  const otherInitial = otherName.charAt(0).toUpperCase();

  return (
    <div className="w-full h-dvh flex flex-col overflow-hidden font-body text-[#454745] bg-gradient-to-b from-[#f4f6f2] to-[#e2e7dd]">

      {/* Chat Top Header */}
      <div className="shrink-0 bg-gradient-to-r from-[#0e0f0c] to-[#1c1f18] px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-full bg-white/10 hover:bg-[#9FE870] hover:text-[#0e0f0c] text-white transition flex items-center gap-1 text-xs font-bold shrink-0"
            title={t('authBackHome')}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <MessageCircle className="w-5 h-5 text-[#9FE870]" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#9FE870] text-[#0e0f0c] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-lg font-heading font-extrabold text-white truncate">{t('messagingTitle')}</h1>
          </div>
        </div>

        {activeThread && activeThread.negotiationStatus !== 'accepted' && (
          <Button
            variant="lime"
            size="sm"
            icon={Tag}
            onClick={() => setShowCounterBox(!showCounterBox)}
          >
            {t('negotiateShort')}
          </Button>
        )}
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">

        {/* Left Sidebar: Conversations */}
        <div className={`md:col-span-4 lg:col-span-3 border-r border-[#e8ebe6] bg-white flex-col min-h-0 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="shrink-0 p-3.5 border-b border-[#e8ebe6] flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#0e0f0c] uppercase tracking-wider">
              {t('chatDiscussionsCount', { n: threads.length })}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5">
            {threads.length === 0 && (
              <div className="p-6 text-center text-[11px] text-[#868685] font-medium">
                {t('chatNoDiscussions')}
              </div>
            )}
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const hasUnread = (thread.unreadCount || 0) > 0 && !isActive;
              return (
                <div
                  key={thread.id}
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setMobileView('chat');
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all duration-150 flex items-center gap-3 border ${
                    isActive
                      ? 'bg-[#0e0f0c] text-white border-[#0e0f0c] shadow-md scale-[1.01]'
                      : 'bg-white text-[#454745] border-[#e8ebe6] hover:bg-[#f4f6f2] hover:border-[#9FE870]/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={thread.productImage}
                      alt={thread.productTitle}
                      className={`w-12 h-12 rounded-xl object-cover border-2 ${isActive ? 'border-[#9FE870]' : 'border-[#e8ebe6]'}`}
                    />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#9FE870] border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs truncate ${hasUnread ? 'font-black' : 'font-bold'} ${isActive ? 'text-white' : 'text-[#0e0f0c]'}`}>
                        {thread.sellerName || thread.otherUser?.name || t('chatDefaultSeller')}
                      </h4>
                      <span className={`text-[9px] shrink-0 ${isActive ? 'text-[#9FE870]' : 'text-[#868685]'}`}>
                        {thread.lastMessageTime || thread.lastUpdated || t('chatRecent')}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 font-medium ${isActive ? 'text-white/70' : 'text-[#868685]'}`}>
                      {thread.productTitle}
                    </p>
                    <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'font-extrabold' : 'font-semibold'} ${isActive ? 'text-[#e2f6d5]' : 'text-[#0e0f0c]'}`}>
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Chat Workspace */}
        <div className={`md:col-span-8 lg:col-span-9 flex-col min-h-0 bg-transparent ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeThread ? (
            <>
              {/* Active Product Bar */}
              <div className="shrink-0 p-3 sm:p-3.5 border-b border-[#e8ebe6] bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2 rounded-full bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#9FE870] transition border border-[#e8ebe6] shrink-0"
                    title={t('chatViewAll')}
                  >
                    <List className="w-4 h-4" />
                  </button>

                  {otherAvatar ? (
                    <img
                      src={otherAvatar}
                      alt={otherName}
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#9FE870] shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0e0f0c] text-[#9FE870] text-xs font-black flex items-center justify-center shrink-0 border-2 border-[#9FE870]">
                      {otherInitial}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-heading font-extrabold text-[#0e0f0c] truncate">
                      {otherName}
                    </h3>
                    <Link href={`/product/${activeThread.productId}`} className="hover:underline flex items-center gap-1 text-[11px] text-[#868685]">
                      <span className="truncate max-w-[140px] sm:max-w-[220px]">{activeThread.productTitle}</span>
                      <span className="shrink-0">• {activeThread.productPrice} TND</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </Link>
                  </div>
                </div>
                {activeThread.negotiationStatus === 'accepted' && (
                  <span className="shrink-0 text-[10px] font-bold bg-[#ffd11a] text-[#4a3b1c] px-2.5 py-1 rounded-full">
                    {t('chatReservedBadge')}
                  </span>
                )}
              </div>

              {/* Deal Concluded Banner */}
              {activeThread.negotiationStatus === 'accepted' && (
                <div className="shrink-0 p-3 bg-[#0e0f0c] border-b border-[#0e0f0c]/10 flex items-center justify-center gap-2 text-center">
                  <CheckCircle2 className="w-4 h-4 text-[#9fe870] shrink-0" />
                  <span className="text-xs font-bold text-[#e8ebe6]">
                    {t('negDealBanner', { amount: activeThread.agreedPrice })}
                  </span>
                </div>
              )}

              {/* Counter Offer Input Box */}
              {showCounterBox && (
                <form onSubmit={handleSendCounterOffer} className="shrink-0 p-3 bg-[#e2f6d5] border-b border-[#0e0f0c]/10 flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="1"
                      placeholder={t('chatOfferPlaceholder')}
                      value={offerInput}
                      onChange={(e) => setOfferInput(e.target.value)}
                      className="w-full pl-4 pr-14 py-2 text-xs font-extrabold rounded-full border border-[#0e0f0c] focus:outline-none bg-white text-[#0e0f0c]"
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#0e0f0c] font-black text-xs">TND</span>
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    {t('sendBtn')}
                  </Button>
                </form>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-3 bg-[#e8ebe6]">
                {(activeThread.messages || []).map((msg, idx) => {
                  const isMe = msg.isMe || msg.sender === 'me' || msg.senderId === user?.uid;
                  const isLastMessage = idx === (activeThread.messages || []).length - 1;

                  if (msg.isSystem) {
                    const isAccepted = msg.systemType === 'accepted';
                    return (
                      <div key={msg.id} className="flex items-center justify-center gap-1.5 my-2 animate-chat-bubble">
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${
                          isAccepted ? 'bg-[#e2f6d5] text-[#054d28]' : 'bg-[#e8ebe6] text-[#868685]'
                        }`}>
                          {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  if (msg.isOffer || msg.type === 'offer') {
                    const canRespond = isLastMessage && !isMe && activeThread.negotiationStatus !== 'accepted';
                    return (
                      <div key={msg.id} className="flex flex-col items-center my-2 animate-chat-bubble">
                        <div className="bg-white border border-[#0e0f0c]/15 rounded-2xl p-4 max-w-xs w-full shadow-md text-center space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#868685] flex items-center justify-center gap-1">
                            <Tag className="w-3 h-3 text-[#0e0f0c]" /> {t('chatDirectOffer')}
                          </span>
                          <div className="text-2xl font-extrabold text-[#0e0f0c]">
                            {msg.offerAmount || msg.amount || msg.text} {msg.offerAmount ? 'TND' : ''}
                          </div>
                          <p className="text-[11px] text-[#868685]">
                            {isMe ? t('chatYouOffered') : t('chatTheyOffered', { name: msg.senderName || otherName })}
                          </p>
                          {msg.note && (
                            <p className="text-xs text-[#454745] italic border-t border-[#0e0f0c]/10 pt-2 mt-1">
                              "{msg.note}"
                            </p>
                          )}
                          {canRespond && (
                            <div className="flex items-center gap-2 pt-2 border-t border-[#0e0f0c]/10">
                              <button
                                type="button"
                                onClick={handleRejectOffer}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#FFEDE8] text-[#a72027] hover:bg-[#a72027] hover:text-white transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> {t('negRejectBtn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptOffer(msg.offerAmount)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> {t('acceptOffer')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (msg.imageUrl) {
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 animate-chat-bubble ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          otherAvatar ? (
                            <img src={otherAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-[#e8ebe6] shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#0e0f0c] text-[#9FE870] text-[9px] font-black flex items-center justify-center shrink-0">
                              {otherInitial}
                            </div>
                          )
                        )}
                        <div className={`max-w-[70%] sm:max-w-[50%] rounded-2xl overflow-hidden border shadow-sm ${
                          isMe ? 'border-[#0e0f0c]' : 'border-[#e8ebe6]'
                        }`}>
                          <img
                            src={msg.imageUrl}
                            alt={t('chatSentImage')}
                            className="w-full h-auto max-h-64 object-cover"
                          />
                          <span className={`text-[9px] block text-right px-2 py-1 ${
                            isMe ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-white text-[#868685]'
                          }`}>
                            {msg.timestamp || t('chatJustNow')}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 animate-chat-bubble ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        otherAvatar ? (
                          <img src={otherAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-[#e8ebe6] shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#0e0f0c] text-[#9FE870] text-[9px] font-black flex items-center justify-center shrink-0">
                            {otherInitial}
                          </div>
                        )
                      )}
                      <div className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? 'bg-[#0e0f0c] text-white rounded-br-md'
                          : 'bg-white text-[#454745] border border-[#e8ebe6] rounded-bl-md'
                      }`}>
                        <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-[#9FE870]' : 'text-[#868685]'}`}>
                          {msg.timestamp || t('chatJustNow')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-2.5 sm:p-3 pb-safe border-t border-[#e8ebe6] bg-white flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1 bg-[#e8ebe6] rounded-full pl-1 pr-1.5 py-1 focus-within:ring-2 focus-within:ring-[#9FE870] transition">
                  <label className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
                    uploadingImage ? 'opacity-50 cursor-wait text-[#868685]' : 'text-[#454745] hover:bg-[#9FE870] hover:text-[#0e0f0c] cursor-pointer'
                  }`} title={t('chatAttachImage')}>
                    <ImageIcon className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChatImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder={t('chatMessagePlaceholder')}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-xs sm:text-sm px-1 py-1.5 text-[#454745] placeholder:text-[#868685]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0e0f0c] text-[#9FE870] flex items-center justify-center transition hover:bg-[#1c1f18] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white border border-[#e8ebe6] shadow-sm flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-[#868685]" />
              </div>
              <p className="text-xs font-bold text-[#868685] max-w-[220px]">
                {t('chatSelectConv')}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function NegotiationChatPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="h-dvh flex items-center justify-center text-xs font-bold text-[#868685]">
        {t('chatLoadingPage')}
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
