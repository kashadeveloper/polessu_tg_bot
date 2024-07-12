import "dotenv/config";
import EventEmitter from "events";
import {
  Bot,
  CallbackQueryContext,
  InlineKeyboard,
  MessageContext,
} from "gramio";
import moment from "moment";
import { getStat } from "./helpers/getStat";
import {
  getChatsList,
  getLatestStat,
  isChatSubscribed,
  subscribeChat,
  unsubscribeChat,
} from "./helpers/updateConfigs";

export const emitter = new EventEmitter();

const bot = new Bot(process.env.TOKEN || "")
  .command("start", (context) =>
    context.send(
      "Привет. Чтобы подписаться на изменения мониторинга - используй команду /subscribe"
    )
  )
  .onStart(({ info }) => {
    console.log(`Started @${info.username}: https://t.me/${info.username}`);
  });

bot.command("subscribe", (context) => {
  if (isChatSubscribed(context.chat.id))
    return context.send(
      "Данный чат уже подписан на уведомления об изменениях. Чтобы отписаться - используйте команду /unsubscribe"
    );
  subscribeChat(context.chatId);
  return context.send(
    "Теперь данный чат подключен для получения уведомлений об изменениях на сайте abit.polessu.by/monit (бюджет)\n\nОтключить уведомления - /unsubscribe"
  );
});

async function statHandler(
  ctx: MessageContext<Bot> | CallbackQueryContext<Bot>
) {
  try {
    const data: {
      updateDate: string;
      data: {
        totalDocumentsByContest: number;
        facults_contest: Record<string, any>;
      };
    } = getLatestStat();
    const date = new Date();
    let facultsText = "";
    for (const [key, value] of Object.entries(data.data.facults_contest)) {
      facultsText += `${key}: <b>${value}</b>\n`;
    }

    return ctx
      .send(
        `Данные на ${moment(date).format(
          "DD.MM.YYYY HH:mm"
        )}\nПоследнее обновление: <b>${
          data.updateDate
        }</b>\n\n${facultsText}\nВсего подавших заявление (только конкурс): ${
          data.data.totalDocumentsByContest
        }\n\n<a href="https://abit.polessu.by/monit/?select=1,1,1">Открыть мониторинг</a>`,
        { parse_mode: "HTML" }
      )
      .catch((err) => {
        console.log(err.message);
        if (ctx.is("callback_query"))
          return ctx.answer({
            show_alert: true,
            text: "Разрешите боту писать вам сообщения",
          });
      })
      .then((res) => {
        if (ctx.is("callback_query")) return ctx.answer(undefined);
      });
  } catch (error) {}
}

bot.command("stat", statHandler);

bot.on("my_chat_member", (ctx) => {
  //   if (ctx.isPM()) return;
  if (
    ctx.newChatMember.user.id === Number(process.env.BOT_ID) &&
    ctx.newChatMember.status === "kicked"
  )
    return unsubscribeChat(ctx.chatId);
  if (
    ctx.newChatMember.user.id === Number(process.env.BOT_ID) &&
    ctx.newChatMember.status === "member" &&
    !ctx.isPM()
  )
    return ctx.send(
      `Теперь я в вашей беседе.\n\nЧтобы подписаться на получение сообщений об изменениях мониторинга, введите команду /subscribe\nТакже можно получить последние данные командой /stat`
    );

  if (
    ctx.newChatMember.user.id === Number(process.env.BOT_ID) &&
    ctx.newChatMember.status === "left"
  ) {
    unsubscribeChat(ctx.chatId);
  }
});

bot.command("unsubscribe", (context) => {
  if (!isChatSubscribed(context.chat.id))
    return context.send("Данный чат не подписан на уведомления");

  unsubscribeChat(context.chat.id);

  return context.send("Отлично. Уведомления отключены");
});

setInterval(getStat, 30000);

emitter.on("statUpdated", async (text) => {
  const chats = getChatsList();

  chats.forEach(async (chat) => {
    if (chat == 0) return;
    return await bot.api.sendMessage({
      chat_id: chat,
      text: text,
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("Статистика", "get_stats"),
    });
  });
});

bot.on("callback_query", (ctx) => {
  if (ctx.queryPayload === "get_stats") return statHandler(ctx);

  return ctx.answer(undefined);
});

bot.start();
