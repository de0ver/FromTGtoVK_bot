const tg_bot = require("node-telegram-bot-api");
const vk_bot = require("node-vk-bot-api");

require("dotenv").config();

let LAST_VK_MESSAGE_ID = 0;
let MESSAGES = {
    0: "MESSAGE TEXT!"
}
let START_DATE = new Date().valueOf();

let TG = new tg_bot(process.env.API_KEY_TG, { polling: true });
let VK = new vk_bot(process.env.API_KEY_VK);

if (TG == null)
    return console.error("TG BOT NOT CREATED! CHECK TG API KEY!");

if (VK == null)
    return console.error("VK BOT NOT CREATED! CHECK VK API KEY!");

console.log('BOTS CREATED!\n' + new Date(START_DATE));

TG.on("text", msg => { fromTGtoVK_Text(msg); });
TG.on("edited_message", msg => { editedMessageTG(msg); } );
TG.on("photo", msg => { photoMessageTG(msg); });
TG.on("video", msg => { videoMessageTG(msg); });

VK.event('message_new', (ctx) => { fromVKtoTG_Text(ctx); });

function fromTGtoVK_Text(message) {
    if (message.chat.id == process.env.TG_CHAT_ID || message.chat.id == process.env.TG_USER_ID) {
        MESSAGES[message.message_id] = message.text;
        VK.sendMessage(process.env.VK_USER_ID,
            "CHAT NAME: " + message.chat.title + "\n" +
            "FROM: t.me/" + message.from.username + "\n" + 
            "MESSAGE: " + message.text
        );
    } else return;
}

function fromVKtoTG_Text(ctx) {
    if (ctx.message.from_id == process.env.VK_USER_ID) {
        //https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/tokens/access-token
        //every 1 hour, bot will spam all messages in poll, need fix   if (new_msg_id > last_msg_id) sendMessage
        if (ctx.message.id > LAST_VK_MESSAGE_ID && ctx.message.date >= Math.floor(START_DATE / 1000)) //kill spam with messages
            TG.sendMessage(process.env.TG_CHAT_ID, ctx.message.text);
            //TG.sendMessage(process.env.TG_USER_ID, ctx.message.text);

        LAST_VK_MESSAGE_ID = ctx.message.id;
    } else return;
}

function editedMessageTG(message) {
    if (MESSAGES[message.message_id]) {
        VK.sendMessage(process.env.VK_USER_ID,
            "CHAT NAME: " + message.chat.title + "\n" +
            "FROM: t.me/" + message.from.username + "\n" + 
            "MESSAGE EDITED: \n" + MESSAGES[message.message_id] + "\n->\n" + message.text);
        MESSAGES[message.message_id] = message.text;
    } else return;
}

function photoMessageTG(message) {
    console.log(message);
    return;
}

function videoMessageTG(message) {
    console.log(message);
    return;
}

VK.startPolling((err) => {
  if (err) console.error(err);
});

TG.on("polling_error", err => console.log(err.data.error.message));