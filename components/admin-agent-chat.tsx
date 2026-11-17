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
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  SandboxExecutionCard,
  SupportTicketsCard,
  ReturnsHistoryCard,
  InventoryStockCard,
  SalesAnalyticsCard,
  MemoryContextCard,
} from "@/components/admin-generative-ui";
import {
  ProductSearchResultsGrid,
  ProductDetailCard,
  ToolLoadingBadge,
  ToolErrorBadge,
} from "@/components/generative-ui";
import { ShieldAlert, User, ShieldCheck } from "lucide-react";

const SUGGESTIONS = [
  "Show me low-stock items",
  "What were yesterday's top sellers?",
  "Summarize this week's revenue",
];

export function AdminAgentChat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/admin/chat",
    }),
  });

  const isGenerating = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <Conversation className="flex-1 overflow-y-auto px-4 py-4">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-3.5 text-primary mb-3">
                <ShieldCheck className="size-7" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                Store Operations Admin Agent
              </h3>
              <p className="mt-1 text-xs max-w-sm">
                Investigate inventory, support tickets, sales analytics, and returns history. Run computations in Vercel Sandbox.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role} className="my-2.5">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="size-4" />
                    ) : (
                      <ShieldAlert className="size-4 text-primary" />
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

                        // Tool parts
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
                            if (toolName === "bash" && toolPart.output) {
                              return (
                                <SandboxExecutionCard
                                  key={`tool-bash-${index}`}
                                  command={toolPart.output.command}
                                  stdout={toolPart.output.stdout}
                                  stderr={toolPart.output.stderr}
                                  exitCode={toolPart.output.exitCode}
                                  durationMs={toolPart.output.durationMs}
                                />
                              );
                            }

                            if (
                              toolName === "getSupportTickets" &&
                              toolPart.output?.tickets
                            ) {
                              return (
                                <SupportTicketsCard
                                  key={`tool-tickets-${index}`}
                                  tickets={toolPart.output.tickets}
                                />
                              );
                            }

                            if (
                              toolName === "getReturnsHistory" &&
                              toolPart.output?.returns
                            ) {
                              return (
                                <ReturnsHistoryCard
                                  key={`tool-returns-${index}`}
                                  returns={toolPart.output.returns}
                                />
                              );
                            }

                            if (
                              toolName === "getInventoryStock" &&
                              toolPart.output?.stockEntries
                            ) {
                              return (
                                <InventoryStockCard
                                  key={`tool-stock-${index}`}
                                  stockEntries={toolPart.output.stockEntries}
                                />
                              );
                            }

                            if (
                              toolName === "getSalesAnalytics" &&
                              toolPart.output?.sales
                            ) {
                              return (
                                <SalesAnalyticsCard
                                  key={`tool-sales-${index}`}
                                  sales={toolPart.output.sales}
                                />
                              );
                            }

                            if (
                              toolName === "saveMemory" &&
                              toolPart.output?.savedContent
                            ) {
                              return (
                                <MemoryContextCard
                                  key={`tool-mem-save-${index}`}
                                  content={toolPart.output.savedContent}
                                  type="saved"
                                />
                              );
                            }

                            if (
                              toolName === "getMemory" &&
                              toolPart.output?.memory
                            ) {
                              return (
                                <MemoryContextCard
                                  key={`tool-mem-get-${index}`}
                                  content={toolPart.output.memory}
                                  type="recalled"
                                />
                              );
                            }

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
              {error.message || "An error occurred while generating the admin response."}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col gap-2.5 border-t bg-card p-3">
        {messages.length === 0 && (
          <Suggestions>
            {SUGGESTIONS.map((s) => (
              <Suggestion
                key={s}
                suggestion={s}
                onClick={() => handleSuggestionClick(s)}
              />
            ))}
          </Suggestions>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask the admin agent about operations, inventory, tickets, sales…"
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
