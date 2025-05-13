'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { db, auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'

interface Conversation {
  id: string
  name?: string
  avatar?: string
  participants: string[]
  participantNames?: string[]
  lastMessage?: string
  timestamp?: any
  unread?: number
}

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: any
}

export default function MessagesPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Get current user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  // Fetch conversations for user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Conversation, 'id'>;
        return { id: doc.id, ...data };
      });
      setConversations(convos)
      if (!activeConversation && convos.length > 0) {
        setActiveConversation(convos[0])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) return setMessages([])
    const q = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Message, 'id'>;
        return { id: doc.id, ...data };
      });
      setMessages(msgs)
    })
    return () => unsub()
  }, [activeConversation])

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !activeConversation) return
    const msg = {
      text: message.trim(),
      senderId: user.uid,
      timestamp: serverTimestamp(),
    }
    await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), msg)
    // Update last message in conversation
    await updateDoc(doc(db, 'conversations', activeConversation.id), {
      lastMessage: message.trim(),
      timestamp: serverTimestamp(),
    })
    setMessage('')
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((convo: Conversation) =>
    (convo.name || convo.participantNames?.join(' ') || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper to get display name (other participant)
  const getConversationName = (convo: Conversation) => {
    if (convo.name) return convo.name
    if (!convo.participantNames || !user) return 'Chat'
    // Show the other participant's name
    const idx = convo.participants.findIndex((id: string) => id !== user.uid)
    return convo.participantNames[idx] || 'Chat'
  }

  // Helper to get avatar initials
  const getAvatar = (convo: Conversation) => {
    if (convo.avatar) return <img src={convo.avatar} alt={getConversationName(convo)} className="w-full h-full rounded-full object-cover" />
    const name = getConversationName(convo)
    return name.split(' ').map((n: string) => n[0]).join('')
  }

  // Helper to format Firestore timestamp
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date()
    const today = new Date()
    const isToday = date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return formatDistanceToNow(date, { addSuffix: false })
  }

  return (
    <div className="flex w-full px-8">
      <div className="w-full max-w-4xl">
        {/* Messages interface */}
        <h1 className="text-2xl font-bold mb-8 pt-8">Messages</h1>
        <div className="flex h-[calc(100vh-180px)]">
          {/* Conversation List */}
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 h-full overflow-y-auto bg-white rounded-l-lg">
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
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No conversations</div>
              ) : filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${activeConversation?.id === conversation.id ? 'bg-gray-50' : ''}`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 text-xs uppercase">
                    {getAvatar(conversation)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-sm truncate">{getConversationName(conversation)}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatMessageTime(conversation.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                  </div>
                  {typeof conversation.unread === 'number' && conversation.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                      {conversation.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Conversation */}
          <div className="hidden md:flex flex-col w-2/3 lg:w-3/4 h-full rounded-r-lg overflow-hidden">
            {activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-3 border-b border-gray-200 flex items-center bg-white">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs uppercase mr-3">
                    {getAvatar(activeConversation)}
                  </div>
                  <h2 className="font-medium">{getConversationName(activeConversation)}</h2>
                </div>
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-sm rounded-lg p-3 ${msg.senderId === user?.uid ? 'bg-[#11244DB3] text-white rounded-br-none' : 'bg-white shadow-sm rounded-bl-none'}`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <div className={`text-right mt-1 text-xs ${msg.senderId === user?.uid ? 'text-blue-100' : 'text-gray-500'}`}>{formatMessageTime(msg.timestamp)}</div>
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
                      className="rounded-full bg-[#11244DB3] hover:bg-[#11244D]/90 text-white"
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
          <div className="flex md:hidden items-center justify-center w-full h-full bg-gray-50 rounded-r-lg">
            <div className="text-center text-gray-500">
              <p className="mb-3">Select a conversation to start messaging</p>
              <Button
                onClick={() => activeConversation && setActiveConversation(activeConversation)}
                className="rounded-full bg-[#11244DB3] hover:bg-[#11244D]/90 text-white"
              >
                View Messages
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 