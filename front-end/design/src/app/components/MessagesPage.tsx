import { useState } from "react";
import { MessageCircle, Send, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  initials: string;
  jobTitle?: string;
}

interface MessagesPageProps {
  appliedJobs?: any[];
}

export function MessagesPage({ appliedJobs = [] }: MessagesPageProps) {
  // Combine mock conversations with new applied jobs
  const newConversations: Conversation[] = appliedJobs.map((job) => {
    const initials = job.postedBy
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
    
    return {
      id: `job-${job.id}`,
      name: job.postedBy,
      lastMessage: `You applied for: ${job.title}`,
      time: "Just now",
      unread: 1,
      initials: initials,
      jobTitle: job.title,
    };
  });

  const allConversations = [...newConversations, ...MOCK_CONVERSATIONS];

  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    allConversations[0]?.id || null
  );
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const selectedChat = allConversations.find(
    (c) => c.id === selectedConversation
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-120px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with those who offer or request jobs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-100px)]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {allConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedConversation === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>{conversation.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">
                            {conversation.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unread > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unread}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedChat.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Active 5 minutes ago
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {selectedChat.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">
                        Hi, I'm interested in your post. Do you still need
                        help?
                      </p>
                      <span className="text-xs text-muted-foreground">10:15</span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">
                        Yes, still looking. Do you have previous experience?
                      </p>
                      <span className="text-xs opacity-80">10:20</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {selectedChat.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">{selectedChat.lastMessage}</p>
                      <span className="text-xs text-muted-foreground">
                        {selectedChat.time}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Write a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Select a conversation
                </h3>
                <p className="text-muted-foreground">
                  Choose a chat to start chatting
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Maria G.",
    lastMessage: "Perfect, see you tomorrow at 10!",
    time: "10:30",
    unread: 0,
    initials: "MG",
  },
  {
    id: "2",
    name: "Carlos R.",
    lastMessage: "Could you bring your own tools?",
    time: "Yesterday",
    unread: 2,
    initials: "CR",
  },
  {
    id: "3",
    name: "Ana M.",
    lastMessage: "Thanks for your interest in the job",
    time: "Monday",
    unread: 0,
    initials: "AM",
  },
];