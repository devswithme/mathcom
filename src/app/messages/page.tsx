'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock data for conversations
const mockConversations = [
  {
    id: '1',
    name: 'Sarah Wilson',
    avatar: null,
    lastMessage: 'See you tomorrow then!',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 mins ago
    unread: 2,
    messages: [
      {
        id: 'm1',
        text: 'Hey, how are you?',
        sender: 'them',
        timestamp: new Date(Date.now() - 40 * 60000) // 40 mins ago
      },
      {
        id: 'm2', 
        text: "I'm good! Just finished work. Want to grab coffee tomorrow?",
        sender: 'you',
        timestamp: new Date(Date.now() - 35 * 60000) // 35 mins ago
      },
      {
        id: 'm3',
        text: 'Sure, that would be great! How about 10am?',
        sender: 'them',
        timestamp: new Date(Date.now() - 32 * 60000) // 32 mins ago
      },
      {
        id: 'm4',
        text: 'See you tomorrow then!',
        sender: 'them',
        timestamp: new Date(Date.now() - 30 * 60000) // 30 mins ago
      }
    ]
  },
  {
    id: '2',
    name: 'James Miller',
    avatar: null,
    lastMessage: 'That sounds great',
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    unread: 0,
    messages: [
      {
        id: 'm1',
        text: 'Hey, do you have time to meet tomorrow?',
        sender: 'you',
        timestamp: new Date(Date.now() - 2.5 * 3600000) // 2.5 hours ago
      },
      {
        id: 'm2',
        text: 'That sounds great',
        sender: 'them',
        timestamp: new Date(Date.now() - 2 * 3600000) // 2 hours ago
      }
    ]
  },
  {
    id: '3',
    name: 'Emma Davis',
    avatar: null,
    lastMessage: 'Can you send me the files?',
    timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
    unread: 1,
    messages: [
      {
        id: 'm1',
        text: 'Can you send me the files?',
        sender: 'them',
        timestamp: new Date(Date.now() - 5 * 3600000) // 5 hours ago
      }
    ]
  },
  {
    id: '4',
    name: 'Michael Brown',
    avatar: null,
    lastMessage: 'Thanks for your help!',
    timestamp: new Date(Date.now() - 8 * 3600000), // 8 hours ago
    unread: 0,
    messages: [
      {
        id: 'm1',
        text: 'Thanks for your help!',
        sender: 'them',
        timestamp: new Date(Date.now() - 8 * 3600000) // 8 hours ago
      }
    ]
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    avatar: null,
    lastMessage: 'Perfect, will do',
    timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
    unread: 0,
    messages: [
      {
        id: 'm1',
        text: 'Perfect, will do',
        sender: 'them',
        timestamp: new Date(Date.now() - 24 * 3600000) // 1 day ago
      }
    ]
  }
];

// Format time for display
const formatMessageTime = (date: Date) => {
  const today = new Date();
  const isToday = date.getDate() === today.getDate() && 
                 date.getMonth() === today.getMonth() && 
                 date.getFullYear() === today.getFullYear();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return formatDistanceToNow(date, { addSuffix: false });
};

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState(mockConversations[0]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter conversations based on search term
  const filteredConversations = mockConversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // In a real app, you'd send this to your API
    console.log('Sending message:', message);
    
    // Clear the input
    setMessage('');
  };
  
  return (
    <div className="flex h-screen pt-14">
      {/* Conversation List */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 h-full overflow-y-auto bg-white">
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-full bg-gray-50 border border-gray-200 text-sm"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-y-auto">
          {filteredConversations.map(conversation => (
            <div 
              key={conversation.id}
              className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 
                ${activeConversation.id === conversation.id ? 'bg-gray-50' : ''}`}
              onClick={() => setActiveConversation(conversation)}
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 text-xs uppercase">
                {conversation.avatar ? (
                  <img src={conversation.avatar} alt={conversation.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  conversation.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatMessageTime(conversation.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
              </div>
              
              {conversation.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                  {conversation.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Conversation */}
      <div className="hidden md:flex flex-col w-2/3 lg:w-3/4 h-full">
        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 border-b border-gray-200 flex items-center bg-white">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs uppercase mr-3">
                {activeConversation.avatar ? (
                  <img src={activeConversation.avatar} alt={activeConversation.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  activeConversation.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <h2 className="font-medium">{activeConversation.name}</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-4">
                {activeConversation.messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs md:max-w-sm rounded-lg p-3 ${
                        msg.sender === 'you' 
                          ? 'bg-[#11244DB3] text-white rounded-br-none' 
                          : 'bg-white shadow-sm rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-right mt-1 text-xs ${msg.sender === 'you' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-full bg-gray-50 border border-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="rounded-full bg-[#11244DB3] hover:bg-[#11244D] text-white"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile: Select a conversation prompt */}
      <div className="flex md:hidden items-center justify-center w-full h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="mb-3">Select a conversation to start messaging</p>
          <Button
            onClick={() => setActiveConversation(mockConversations[0])}
            className="rounded-full bg-[#11244DB3] hover:bg-[#11244D] text-white"
          >
            View Messages
          </Button>
        </div>
      </div>
    </div>
  );
} 