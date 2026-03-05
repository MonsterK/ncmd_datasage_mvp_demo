import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CategoryNode, Metric, Tenant } from "@/types"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  actions?: { id: string; label: string }[]
}

export function WorkspaceChatView({
  metrics,
  tenants,
  categories,
  onBack,
  fullScreen,
}: {
  metrics: Metric[]
  tenants: Tenant[]
  categories: CategoryNode[]
  onBack?: () => void
  fullScreen?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "I am your metric assistant. I can create metrics, bind categories, and deploy them through chat. Try: “create metric daily active users” or “deploy metric spp_revenue to Hive table”.",
    },
  ])
  const [input, setInput] = useState("")

  const buildAssistantReply = (text: string): ChatMessage => {
    const lower = text.toLowerCase()
    if (lower.includes("下发") || lower.includes("dispatch")) {
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
    <div className={fullScreen ? "relative h-full w-full p-6" : ""}>
      {onBack && fullScreen && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs absolute left-6 top-6"
          onClick={onBack}
        >
          back to homepage
        </Button>
      )}
      <Card className="border-slate-200 shadow-sm rounded-2xl flex flex-col min-h-[640px] h-full">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">AI Workspace</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Create metrics, bind categories, and deploy to target systems via chat.
              </CardDescription>
            </div>
            {onBack && !fullScreen && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onBack}>
                back to homepage
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={
                      message.role === "user"
                        ? "inline-block max-w-[80%] rounded-2xl bg-blue-600 text-white px-4 py-2 text-xs"
                        : "inline-block max-w-[80%] rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs"
                    }
                  >
                    {message.content}
                  </div>
                  {message.actions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <Button
                          key={action.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px]"
                          onClick={() => handleAction(action.label)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t border-slate-100 px-6 py-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => handleQuickInput("create metric daily active users")}
              >
                Create metric
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => handleQuickInput("deploy metric spp_revenue to Hive table")}
              >
                Deploy metric
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your request, e.g. create metric order conversion rate"
                className="h-9 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend()
                  }
                }}
              />
              <Button type="button" size="sm" className="h-9 text-xs" onClick={handleSend}>
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
