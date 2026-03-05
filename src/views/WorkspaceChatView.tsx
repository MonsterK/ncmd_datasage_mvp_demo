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
        "我是你的指标助手，可以通过对话创建指标、绑定类目并发起下发。你可以直接说：“创建指标 日活跃用户”或“下发指标 spp_revenue 到 Hive 表”。",
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
          "已识别为下发请求。我可以将指标发布到目标系统，并生成校验报告。请选择目标或补充目标信息。",
        actions: [
          { id: "dispatch-aeolus", label: "下发到 Aeolus 数据集" },
          { id: "dispatch-hive", label: "下发到 Hive 表" },
        ],
      }
    }
    if (lower.includes("创建") || lower.includes("create") || lower.includes("新增")) {
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "已生成指标草案。请确认租户与类目路径，我将生成字段与表达式建议。",
        actions: [
          { id: "draft-confirm", label: "确认创建草案" },
          { id: "draft-edit", label: "补充信息" },
        ],
      }
    }
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "我可以帮你创建指标或下发指标。可以试试：“创建指标 订单转化率”或“下发指标 to Hive”。",
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
      content: `已选择：${actionLabel}。请补充指标名称、目标或确认默认配置。`,
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
          返回首页
        </Button>
      )}
      <Card className="border-slate-200 shadow-sm rounded-2xl flex flex-col min-h-[640px] h-full">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">AI Workspace</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                通过对话创建指标、绑定类目并下发到目标系统。
              </CardDescription>
            </div>
            {onBack && !fullScreen && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onBack}>
                返回首页
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
                onClick={() => handleQuickInput("创建指标 日活跃用户")}
              >
                创建指标
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => handleQuickInput("下发指标 spp_revenue 到 Hive 表")}
              >
                下发指标
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的请求，例如：创建指标 订单转化率"
                className="h-9 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend()
                  }
                }}
              />
              <Button type="button" size="sm" className="h-9 text-xs" onClick={handleSend}>
                发送
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
