import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatsAPI, usersAPI, messagesAPI } from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { formatMessageTime, getAvatarUrl } from '../lib/utils';
import type { Chat, Message, User } from '../types';

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [mobileView, setMobileView] = useState<'chats' | 'chat'>('chats');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = getSocket();

  useEffect(() => {
    loadChats();
    connectToSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    try {
      const data = await chatsAPI.getAll();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const connectToSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setConnectionStatus('connecting');
    const socket = connectSocket(token);

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('new_message', (message: Message) => {
      if (selectedChat && message.chatId === selectedChat.id) {
        setMessages((prev) => [...prev, message]);
      }
      loadChats();
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await usersAPI.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (targetUser: User) => {
    try {
      const chat = await chatsAPI.createDirect(targetUser.id);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      loadChats();
      setSelectedChat(chat);
      setMobileView('chat');
      loadMessages(chat.id);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setMobileView('chat');
    await loadMessages(chat.id);
    
    const socket = getSocket();
    if (socket) {
      socket.emit('join_chat', chat.id);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const data = await messagesAPI.getByChatId(chatId, 50);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const socket = getSocket();
    if (!socket) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    socket.emit('send_message', {
      chatId: selectedChat.id,
      text: messageText,
    });
  };

  const handleBack = () => {
    setMobileView('chats');
    setSelectedChat(null);
  };

  const getChatName = (chat: Chat) => {
    const otherMember = chat.members.find((m) => m.user.id !== user?.id);
    return otherMember?.user.displayName || 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    const otherMember = chat.members.find((m) => m.user.id !== user?.id);
    return otherMember ? getAvatarUrl(otherMember.user.username) : '';
  };

  const getLastMessage = (chat: Chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const msg = chat.messages[0];
      return msg.senderId === user?.id ? `Вы: ${msg.text}` : msg.text;
    }
    return 'Нет сообщений';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mobileView === 'chat' && (
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-bold text-white">Messenger</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
            {connectionStatus === 'connecting' ? 'Подключение...' : connectionStatus === 'connected' ? 'Подключено' : 'Отключено'}
          </span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            🔍
          </button>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Поиск пользователей</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="@username"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              autoFocus
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(searchUser.username)}
                      alt={searchUser.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{searchUser.displayName}</p>
                      <p className="text-gray-400 text-sm">{searchUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(searchUser)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition min-h-[44px]"
                  >
                    Написать
                  </button>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-gray-400 text-center py-4">Пользователи не найдены</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chats List */}
        {mobileView === 'chats' && (
          <div className="w-full md:w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Чаты</h2>
              {chats.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Нет чатов. Нажмите 🔍 для поиска пользователей.
                </p>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                        selectedChat?.id === chat.id ? 'bg-primary-600' : 'hover:bg-gray-700'
                      }`}
                    >
                      <img
                        src={getChatAvatar(chat)}
                        alt={getChatName(chat)}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{getChatName(chat)}</p>
                        <p className="text-gray-400 text-sm truncate">{getLastMessage(chat)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat View */}
        {mobileView === 'chat' && selectedChat && (
          <div className="flex-1 flex flex-col bg-gray-900">
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
              <img
                src={getChatAvatar(selectedChat)}
                alt={getChatName(selectedChat)}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-white font-medium">{getChatName(selectedChat)}</p>
                <p className="text-gray-400 text-sm">{selectedChat.members.find((m) => m.user.id !== user?.id)?.user.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Начните диалог</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.senderId === user?.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className={`text-xs mt-1 ${message.senderId === user?.id ? 'text-primary-200' : 'text-gray-400'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Написать сообщение..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition min-h-[48px]"
                >
                  →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State (Desktop) */}
        {!selectedChat && mobileView === 'chats' && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-900">
            <div className="text-center">
              <p className="text-gray-400 text-lg">Выберите чат или найдите пользователя</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
