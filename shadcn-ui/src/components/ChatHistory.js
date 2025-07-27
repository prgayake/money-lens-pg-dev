import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "../contexts/AuthContext";
import {
  MessageCircle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";

function ChatHistory({ onChatSelect, currentChatId }) {
  const { getUserChats, createNewChat, deleteChat, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await getUserChats();
      setChats(userChats || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChatId = await createNewChat();
      if (newChatId) {
        await loadChats(); // Refresh the chat list
        onChatSelect(newChatId);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        const success = await deleteChat(chatId);
        if (success) {
          await loadChats(); // Refresh the chat list
          if (currentChatId === chatId) {
            onChatSelect(null);
          }
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (!message) return "No messages yet";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat History
          </CardTitle>
          <Button onClick={handleNewChat} size="sm" className="h-8 px-3">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
        <Separator />
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">
                Start a conversation to see your chat history
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                    currentChatId === chat.id
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "border-gray-200"
                  }`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {chat.title || "Untitled Chat"}
                        </h4>
                        {currentChatId === chat.id && (
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {truncateMessage(chat.last_message)}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(chat.updated_at)}
                        </div>

                        {chat.message_count && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5"
                          >
                            {chat.message_count} messages
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ChatHistory;
