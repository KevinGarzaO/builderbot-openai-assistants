import "dotenv/config";

export class ChatGPTClass {
  queue = [];
  optionsGPT = { model: "gpt-3.5-turbo", temperature: 0 };
  openai = undefined;

  constructor() {
    this.init().then();
  }

  /**
   * Esta funciona inicializa
   */
  init = async () => {
    const { ChatGPTAPI } = await import("chatgpt");
    this.openai = new ChatGPTAPI(
      {
        apiKey: process.env.OPENAI_API_KEY
      }
    );
  };

  handleMsgChatGPT = async (ctx, body) => {

    const interaccionChatGPT = await this.openai.sendMessage(body, {
      conversationId: btoa(ctx.from)
        ? undefined
        : this.queue[this.queue.length - 1].conversationId,
      parentMessageId: !this.queue.length
        ? undefined
        : this.queue[this.queue.length - 1].id,
    });

    this.queue.push(interaccionChatGPT);
    return interaccionChatGPT
  }
}
