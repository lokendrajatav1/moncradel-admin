"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, X, Send, Edit2, Trash2, Check, X as CancelIcon, ChevronDown, Reply as ReplyIcon, Phone } from 'lucide-react';
import api from '@/utils/api';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete, confirmAction } from '@/utils/alert';
import { io, Socket } from 'socket.io-client';

interface Reply {
  _id: string;
  sender: 'user' | 'admin';
  message: string;
  createdAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  isRead: boolean;
  quotedReplyId?: string | null;
}

interface Ticket {
  _id: string;
  userId: { _id: string; name: string; role: string; email: string; phone?: string };
  orderId?: { _id: string; orderNumber: string };
  issueType: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  replies: Reply[];
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination & Debounce State
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  // Modal & Socket State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Edit / Delete / Quote State
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [quotingReplyId, setQuotingReplyId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Socket Connection
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Connect to the base backend URL
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const newSocket = io(backendUrl, {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Listen for live ticket replies
  useEffect(() => {
    if (!socket) return;

    const handleTicketReply = (updatedTicket: Ticket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setSelectedTicket(prev => (prev && prev._id === updatedTicket._id) ? updatedTicket : prev);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    socket.on('ticket_reply', handleTicketReply);

    // Join room on reconnect if modal is open
    const handleConnect = () => {
      if (selectedTicket?._id) {
        socket.emit('join_ticket_room', selectedTicket._id);
      }
    };
    socket.on('connect', handleConnect);

    return () => {
      socket.off('ticket_reply', handleTicketReply);
      socket.off('connect', handleConnect);
    };
  }, [socket, selectedTicket?._id]);

  // Join the ticket room whenever a chat is opened
  useEffect(() => {
    if (socket && socket.connected && selectedTicket?._id) {
      socket.emit('join_ticket_room', selectedTicket._id);
    }
  }, [socket, selectedTicket?._id]);

  // Scroll to bottom when opening modal (instant scroll without flash)
  useEffect(() => {
    if (isModalOpen && selectedTicket && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [isModalOpen, selectedTicket]);

  const markMessagesAsRead = async (ticketId: string) => {
    try {
      if (socket) {
        socket.emit('mark_as_read', ticketId);
      } else {
        await api.put(`/support/${ticketId}/read`);
      }
    } catch (e) {
      console.error('Failed to mark messages as read');
    }
  };

  useEffect(() => {
    if (isModalOpen && selectedTicket) {
      const hasUnread = selectedTicket.replies.some(r => r.sender === 'user' && !r.isRead);
      if (hasUnread) {
        markMessagesAsRead(selectedTicket._id);
      }
    }
  }, [isModalOpen, selectedTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage)
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      const { data } = await api.get(`/support?${params.toString()}`);
      if (data.success) {
        setTickets(data.data);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      showError('Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    // Listen for global push notifications to refresh the tickets table instantly
    const handleNewNotification = () => {
      fetchTickets();
    };
    window.addEventListener('new_notification', handleNewNotification);

    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
    };
  }, [currentPage, itemsPerPage, debouncedSearch]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const openReplyModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setEditingReplyId(null);
    setQuotingReplyId(null);
    setOpenDropdownId(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const ticketId = selectedTicket?._id;
    if (!socket || !ticketId || !isModalOpen) return;

    const handleConnect = () => {
      socket.emit('join_ticket_room', ticketId);
    };

    socket.on('connect', handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, selectedTicket?._id, isModalOpen]);

  const handleReplySubmit = async (e: React.FormEvent, resolve: boolean = false) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !resolve)) return;

    // Handle Edit Submission
    if (editingReplyId && !resolve) {
      try {
        const { data } = await api.put(`/support/${selectedTicket._id}/reply/${editingReplyId}`, {
          message: replyText
        });
        if (data.success) {
          setEditingReplyId(null);
          setReplyText('');
          if (textareaRef.current) textareaRef.current.style.height = '48px';
        }
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to edit reply');
      }
      return;
    }

    try {
      if (resolve) showLoading('Resolving ticket...');
      
      const payload: any = { message: replyText || 'Marked as resolved by Admin.' };
      if (resolve) payload.status = 'resolved';
      if (quotingReplyId) payload.quotedReplyId = quotingReplyId;

      if (!resolve) {
        setReplyText('');
        setQuotingReplyId(null);
        if (textareaRef.current) textareaRef.current.style.height = '48px';
      }

      if (socket) {
        socket.emit('send_reply', { ticketId: selectedTicket._id, ...payload });
        if (resolve) {
          hideAlert();
          showSuccess('Ticket resolved!');
          setIsModalOpen(false);
        }
      } else {
        const { data } = await api.put(`/support/${selectedTicket._id}/reply`, payload);
        if (data.success && resolve) {
          hideAlert();
          showSuccess('Ticket resolved!');
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const startEditing = (reply: Reply) => {
    setEditingReplyId(reply._id);
    setReplyText(reply.message);
    setQuotingReplyId(null); // Cancel quote if any
    setOpenDropdownId(null);
  };

  const startQuoting = (reply: Reply) => {
    setQuotingReplyId(reply._id);
    setOpenDropdownId(null);
  };

  // (Handle Edit moved inside handleReplySubmit)

  const handleDeleteReply = async (replyId: string) => {
    if (!selectedTicket) return;
    
    setOpenDropdownId(null);
    const confirmed = await confirmDelete('this message');
    if (!confirmed) return;

    try {
      await api.delete(`/support/${selectedTicket._id}/reply/${replyId}`);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to delete reply');
    }
  };


  const getQuotedMessage = (quotedId: string) => {
    if (!selectedTicket) return null;
    return selectedTicket.replies.find(r => r._id === quotedId);
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'filter 0.3s ease';
      el.style.filter = 'brightness(0.7)';
      setTimeout(() => {
        el.style.filter = 'none';
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support Center</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by customer or issue..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading && tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tickets found.</div>
          ) : (
            <>
              <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer / Role</th>
                  <th className="px-6 py-4 font-semibold">Issue Type</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ticket.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 uppercase font-semibold mt-0.5">{ticket.userId?.role || 'user'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{ticket.issueType.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-xs text-gray-500 truncate w-48">{ticket.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openReplyModal(ticket)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors ml-auto"
                      >
                        <MessageCircle className="h-4 w-4" /> Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && tickets.length > 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
                <div className="animate-pulse text-blue-600 font-medium">Loading...</div>
              </div>
            )}
            </>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalCount > 0 && (() => {
          const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
          const startIndex = (currentPage - 1) * itemsPerPage;
          return (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Reply Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900">Ticket from {selectedTicket.userId?.name}</h2>
              <div className="flex items-center gap-3">
                {selectedTicket.userId?.phone && (
                  <a 
                    href={`tel:${selectedTicket.userId.phone}`} 
                    title="Call User" 
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center justify-center border border-blue-200"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <button 
                    type="button" 
                    onClick={async (e) => {
                      const confirmed = await confirmAction('Resolve Ticket?', 'Are you sure you want to mark this ticket as resolved?', 'Yes, resolve it!');
                      if(confirmed) {
                        handleReplySubmit(e, true);
                      }
                    }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 font-medium rounded-full hover:bg-green-100 transition-colors text-xs flex items-center gap-1 border border-green-200"
                  >
                    <Check className="h-3 w-3" /> Resolve Ticket
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <details className="p-4 border-b border-gray-200 bg-blue-50/50 shrink-0 group">
              <summary className="font-semibold text-gray-900 cursor-pointer outline-none list-none flex items-center justify-between">
                Issue: {selectedTicket.issueType.replace('_', ' ').toUpperCase()}
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap break-words">{selectedTicket.description}</p>
            </details>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
              {selectedTicket.replies?.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4 bg-white/50 mx-auto rounded-lg w-fit px-4 shadow-sm mt-4">No replies yet.</div>
              ) : (
                selectedTicket.replies.map((reply, idx) => {
                  const isMine = reply.sender === 'admin';
                  const quotedMsg = reply.quotedReplyId ? getQuotedMessage(reply.quotedReplyId) : null;

                  return (
                    <div id={`msg-${reply._id}`} key={reply._id || idx} className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'} px-4 relative`}>
                      
                      {/* Message Bubble */}
                      <div 
                        onClick={() => !reply.isDeleted && setOpenDropdownId(openDropdownId === reply._id ? null : reply._id)}
                        className={`relative max-w-[80%] rounded-lg shadow-sm px-3 pt-2 pb-1.5 text-sm cursor-pointer active:bg-black/5 transition-colors ${
                          isMine ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' : 'bg-white text-[#111b21] rounded-tl-none'
                        }`}
                      >
                          
                          {/* Dropdown Chevron (WhatsApp style) */}
                          {!reply.isDeleted && (
                            <button 
                              className="absolute top-1 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 bg-gradient-to-l from-[#d9fdd3] pl-2"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          )}

                          {/* Dropdown Menu */}
                          {openDropdownId === reply._id && (
                            <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} className="absolute top-6 right-2 bg-white shadow-lg rounded-md border border-gray-200 z-10 w-32 py-1 flex flex-col">
                              <button onClick={(e) => { e.stopPropagation(); startQuoting(reply); }} className="text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">Reply</button>
                              {isMine && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); startEditing(reply); }} className="text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">Edit</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteReply(reply._id); }} className="text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Delete</button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Quoted Message */}
                          {quotedMsg && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); reply.quotedReplyId && scrollToMessage(reply.quotedReplyId); }}
                              className="bg-black/5 border-l-4 border-[#00a884] rounded p-2 mb-1 cursor-pointer"
                            >
                              <div className="text-[11px] font-semibold text-[#00a884]">
                                {quotedMsg.sender === 'admin' ? 'Admin' : selectedTicket.userId?.name}
                              </div>
                              <div className="text-[12px] text-gray-600 truncate max-w-full">
                                {quotedMsg.isDeleted ? '🚫 This message was deleted' : quotedMsg.message}
                              </div>
                            </div>
                          )}

                          {/* Main Message Text */}
                          <div className={`pr-10 whitespace-pre-wrap ${reply.isDeleted ? 'italic text-gray-500' : ''}`}>
                            {reply.message}
                          </div>
                          
                          {/* Time and Tags */}
                          <div className="text-[10px] text-gray-500 flex justify-end items-center gap-1 mt-0.5 float-right select-none ml-2">
                            {reply.isEdited && !reply.isDeleted && <span>Edited</span>}
                            <span>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && (
                              <div className="ml-0.5 mt-0.5">
                                {!reply.isRead ? (
                                  <svg viewBox="0 0 16 15" width="16" height="15" className="text-gray-400 fill-current"><path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                ) : (
                                  <svg viewBox="0 0 16 15" width="16" height="15" className="text-blue-500 fill-current"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                )}
                              </div>
                            )}
                          </div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Invisible div to scroll to bottom */}
              <div ref={chatEndRef} />
            </div>

            {selectedTicket.status !== 'resolved' ? (
              <div className="bg-[#f0f2f5] p-3 rounded-b-xl flex flex-col">
                {/* Editing or Quoting Banner */}
                {(quotingReplyId || editingReplyId) && (() => {
                  const id = quotingReplyId || editingReplyId;
                  const msg = getQuotedMessage(id as string);
                  if (!msg) return null;

                  return (
                    <div className="bg-black/5 border-l-4 border-blue-500 rounded p-2 mb-2 flex justify-between items-center mr-[4.5rem]">
                      <div>
                        <div className="text-[12px] font-semibold text-blue-600">
                          {editingReplyId ? 'Editing Message' : 'Replying to ' + (msg.sender === 'admin' ? 'Admin' : selectedTicket.userId?.name)}
                        </div>
                        <div className="text-[13px] text-gray-600 truncate max-w-sm">
                          {msg.isDeleted ? '🚫 This message was deleted' : msg.message}
                        </div>
                      </div>
                      <button onClick={() => {
                        setQuotingReplyId(null);
                        if (editingReplyId) {
                          setEditingReplyId(null);
                          setReplyText('');
                        }
                      }} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })()}

                <form onSubmit={(e) => handleReplySubmit(e, false)} className="flex items-end gap-2 w-full relative">
                  <textarea 
                    ref={textareaRef}
                    required
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      e.target.style.height = '48px';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                    }}
                    placeholder="Type a message..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReplySubmit(e, false);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-white border-0 rounded-lg focus:outline-none focus:ring-0 resize-none min-h-[48px] shadow-sm text-[15px] custom-scrollbar overflow-y-auto"
                    style={{ height: '48px' }}
                  />
                  <button 
                    type="submit"
                    className="flex-shrink-0 h-12 w-12 bg-[#00a884] flex items-center justify-center text-white rounded-full hover:bg-[#008f6f] transition-colors shadow-sm"
                  >
                    <Send className="h-5 w-5 -ml-1 mt-0.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-[#f0f2f5] rounded-b-xl text-center text-gray-500 font-medium text-sm">
                This ticket has been resolved and closed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
