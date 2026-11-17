"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  ProductSearchResultsGrid,
  ProductDetailCard,
  ReturnConfirmationCard,
  ToolLoadingBadge,
  ToolErrorBadge,
} from "@/components/generative-ui";
import { Bot, User, Sparkles } from "lucide-react";

export function AgentChat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isGenerating = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <Conversation className="flex-1 overflow-y-auto px-4 py-3">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
                <Sparkles className="size-6" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">
                Ship It Shop Assistant
              </h3>
              <p className="mt-1 text-xs max-w-[240px]">
                Ask me to find products, check stock, or help you process an order return!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role} className="my-2">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="size-3.5" />
                    ) : (
                      <Bot className="size-3.5" />
                    )}
                  </div>
                  <MessageContent className="flex-1">
                    {m.parts && m.parts.length > 0 ? (
                      m.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <MessageResponse
                              key={`text-${index}`}
                              isAnimating={isGenerating && index === m.parts.length - 1}
                            >
                              {part.text}
                            </MessageResponse>
                          );
                        }

                        // Tool parts handling
                        const isToolPart =
                          part.type.startsWith("tool-") || part.type === "dynamic-tool";

                        if (isToolPart) {
                          const toolName =
                            "toolName" in part
                              ? (part as { toolName: string }).toolName
                              : part.type.replace(/^tool-/, "");
                          const toolPart = part as {
                            state: string;
                            output?: any;
                            errorText?: string;
                          };

                          if (
                            toolPart.state === "input-streaming" ||
                            toolPart.state === "input-available"
                          ) {
                            return (
                              <ToolLoadingBadge
                                key={`tool-loading-${index}`}
                                name={toolName}
                              />
                            );
                          }

                          if (
                            toolPart.state === "output-error" ||
                            toolPart.output?.success === false
                          ) {
                            return (
                              <ToolErrorBadge
                                key={`tool-err-${index}`}
                                name={toolName}
                                error={
                                  toolPart.errorText || toolPart.output?.error
                                }
                              />
                            );
                          }

                          if (toolPart.state === "output-available") {
                            if (
                              toolName === "searchProducts" &&
                              toolPart.output?.products
                            ) {
                              return (
                                <ProductSearchResultsGrid
                                  key={`tool-grid-${index}`}
                                  products={toolPart.output.products}
                                />
                              );
                            }

                            if (
                              toolName === "getProductDetails" &&
                              toolPart.output?.product
                            ) {
                              return (
                                <ProductDetailCard
                                  key={`tool-detail-${index}`}
                                  product={toolPart.output.product}
                                  stock={toolPart.output.stock}
                                />
                              );
                            }

                            if (
                              toolName === "returnOrder" &&
                              toolPart.output?.orderId
                            ) {
                              return (
                                <ReturnConfirmationCard
                                  key={`tool-return-${index}`}
                                  orderId={toolPart.output.orderId}
                                  returnRecord={toolPart.output.returnRecord}
                                  refundPreauthorization={
                                    toolPart.output.refundPreauthorization
                                  }
                                />
                              );
                            }
                          }
                        }

                        return null;
                      })
                    ) : null}
                  </MessageContent>
                </div>
              </Message>
            ))
          )}

          {error && (
            <div className="my-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error.message || "An error occurred while generating the response."}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onFocus={(e) => {
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 250);
              }}
              placeholder="Ask for products, sizes, stock, or returns..."
              disabled={isGenerating}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || isGenerating}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
