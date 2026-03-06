import { useState } from "react"
import { Clock, MessageSquare, ChevronRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CategoryNode, Metric } from "@/types"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  actions?: { id: string; label: string }[]
}

type HistoryGroup = {
  label: string
  items: { id: string; title: string; time: string }[]
}

const HISTORY_MOCK: HistoryGroup[] = [
  {
    label: "Today",
    items: [
      { id: "h1", title: "Create Metric: DAU", time: "10:23 AM" },
      { id: "h2", title: "Deploy: Revenue", time: "09:45 AM" },
    ],
  },
  {
    label: "Yesterday",
    items: [
      { id: "h3", title: "Explain: Retention", time: "4:30 PM" },
    ],
  },
  {
    label: "Previous 7 Days",
    items: [
      { id: "h4", title: "Create Dimension: User Type", time: "Mar 3" },
      { id: "h5", title: "Show lineage: Orders", time: "Mar 1" },
    ],
  },
]

export function WorkspaceChatView({
  metrics,
  categories,
  onBack,
  fullScreen,
}: {
  metrics: Metric[]
  categories: CategoryNode[]
  onBack?: () => void
  fullScreen?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "I am your smart assistant. I can create metrics&dimensions and deploy them through chat. Try: “create metric daily active users” or “deploy metric spp_revenue to Hive table”.",
    },
  ])
  const [input, setInput] = useState("")

  const buildAssistantReply = (text: string): ChatMessage => {
    const lower = text.toLowerCase()
    if (lower.includes("下发") || lower.includes("dispatch") || lower.includes("deploy")) {
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Deployment request recognized. I can publish the metric to a target system and generate a validation report. Choose a target or provide more details.",
        actions: [
          { id: "dispatch-aeolus", label: "Deploy to Aeolus dataset" },
          { id: "dispatch-hive", label: "Deploy to Hive table" },
        ],
      }
    }
    if (lower.includes("创建") || lower.includes("create") || lower.includes("新增")) {
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Draft metric created. Confirm the tenant and category path, and I will generate field and expression suggestions.",
        actions: [
          { id: "draft-confirm", label: "Confirm draft creation" },
          { id: "draft-edit", label: "Add details" },
        ],
      }
    }
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "I can help you create or deploy metrics. Try: “create metric order conversion rate” or “deploy metric to Hive”.",
    }
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }
    const assistantMessage = buildAssistantReply(trimmed)
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
  }

  const handleAction = (actionLabel: string) => {
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Selected: ${actionLabel}. Please provide the metric name and target, or confirm the default configuration.`,
    }
    setMessages((prev) => [...prev, assistantMessage])
  }

  const handleQuickInput = (text: string) => {
    setInput(text)
  }

  return (
    <div className={fullScreen ? "h-full w-full p-6 bg-slate-50" : ""}>
      <Card className="border-slate-200 shadow-sm rounded-2xl flex h-full bg-white overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              History
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-6">
              {HISTORY_MOCK.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h4 className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {group.label}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-2 py-2 rounded-lg hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent transition-all group"
                      >
                        <div className="text-xs font-medium text-slate-700 group-hover:text-blue-600 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.time}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CardHeader className="pb-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">AI Workspace</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Create metrics & dimensions, and delivery to target systems via chat.
                </CardDescription>
              </div>
              {onBack && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200" 
                  onClick={onBack}
                >
                  Back
                </Button>
              )}
            </div>
          </CardHeader>
          <div className="flex-1 overflow-hidden relative bg-white">
            <ScrollArea className="h-full px-6 py-6">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 text-white px-4 py-2.5 text-sm shadow-sm"
                          : "max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 text-slate-700 px-4 py-2.5 text-sm"
                      }
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.actions && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleAction(action.label)}
                              className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                onClick={() => setInput("create metric daily active users")}
              >
                <MessageSquare className="h-3 w-3" />
                Create metric
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                onClick={() => setInput("deploy metric spp_revenue to Hive table")}
              >
                 <MessageSquare className="h-3 w-3" />
                Deploy metric
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your request..."
                className="h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend()
                  }
                }}
              />
              <Button 
                type="button" 
                size="sm" 
                className="h-10 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200" 
                onClick={handleSend}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
