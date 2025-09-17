const tg_bot = require("node-telegram-bot-api");
const vk_bot = require("node-vk-bot-api");
const unirest = require("unirest");
const cheerio = require("cheerio");

require("dotenv").config();

let LAST_VK_MESSAGE_ID = 0;
let MESSAGES = {
    0: "WHITELIST (t2) SPOOFER \\_//"
}
let START_DATE = new Date().valueOf();

let TG = null;
let VK = null;

function handlersSetup() {
    TG.removeAllListeners();

    TG.on("text", msg => { fromTGtoVK_Text(msg); });
    TG.on("edited_message", msg => { editedMessageTG(msg); } );
    TG.on("photo", msg => { photoMessageTG(msg); });
    TG.on("video", msg => { videoMessageTG(msg); });

    setInterval(deletedMessagesTG, 5 * 60 * 1000);

    VK.command('/скрепинг', async (ctx) => { await parseSite(ctx); });
    VK.event("message_new", (ctx) => { fromVKtoTG_Text(ctx); });

    VK.startPolling((err) => {
        console.error(err);
        restartBots();
    });

    TG.on("polling_error", err => { 
        console.error(err); 
        restartBots(); 
    });

    TG.on("error", err => {
        console.error(err);
        restartBots();
    });
}

function initializeBots() {
    try {
        TG = new tg_bot(process.env.API_KEY_TG, { polling: true });
        VK = new vk_bot(process.env.API_KEY_VK);

        if (TG == null)
            return console.error("TG BOT NOT CREATED! CHECK TG API KEY!");

        if (VK == null)
            return console.error("VK BOT NOT CREATED! CHECK VK API KEY!");

        console.log('BOTS CREATED!\n' + new Date(START_DATE));

        VK.sendMessage(process.env.VK_USER_ID, "BOT STARTED: " + new Date(START_DATE));
        TG.sendMessage(process.env.TG_USER_ID, "BOT STARTED: " + new Date(START_DATE));

        handlersSetup();

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function restartBots() {
    try {
        if (TG)
            TG.stopPolling();

        //if (VK)
            //VK.removeAllListeners();
    } catch (e) {
        console.error(e);
    }

    setTimeout(() => {
        if (!initializeBots)
            restartBots();

    }, 15 * 60 * 1000);
}

function fromTGtoVK_Text(message) {
    if (message.chat.id == process.env.TG_CHAT_ID || message.chat.id == process.env.TG_USER_ID) {
        MESSAGES[message.message_id] = message.text;
        if (message.date >= Math.floor(START_DATE / 1000)) {
            VK.sendMessage(process.env.VK_USER_ID,
                "CHAT NAME: " + (message.chat.title == undefined ? message.chat.username : message.chat.title) + "\n" +
                "FROM: t.me/" + message.from.username + "\n" + 
                "TIME: " + new Date(message.date * 1000) +
                "MESSAGE: " + message.text
            );
            // TG.sendMessage(process.env.TG_USER_ID, 
            //     "MESSAGE POSTED: \n" + message.text + "\n" + 
            //     "MESSAGE INFO -- ID: " + message.message_id + "MD: " + message.date + " SD: " + Math.floor(START_DATE / 1000));
        }
    } else return;
}

function fromVKtoTG_Text(ctx) {
    if (ctx.message.from_id == process.env.VK_USER_ID) {
        //https://id.vk.com/about/business/go/docs/ru/vkid/latest/vk-id/connection/tokens/access-token
        //every 1 hour, bot will spam all messages in poll, need fix   if (new_msg_id > last_msg_id) sendMessage
        if (ctx.message.id > LAST_VK_MESSAGE_ID && ctx.message.date >= Math.floor(START_DATE / 1000)) {
            TG.sendMessage(process.env.TG_CHAT_ID, ctx.message.text);
            //VK.execute("messages.delete", { 'message_ids': ctx.message.id, 'peer_id': process.env.VK_USER_ID });
            // VK.sendMessage(process.env.VK_USER_ID, 
            //     "MESSAGE POSTED: \n" + ctx.message.text + "\n" + 
            //     "MESSAGE INFO -- ID: " + ctx.message.id + " LM_ID: " + LAST_VK_MESSAGE_ID + " MD: " + ctx.message.date + " SD: " + Math.floor(START_DATE / 1000));

            LAST_VK_MESSAGE_ID = ctx.message.id;
        }
    } else return;
}

function editedMessageTG(message) {
    if (MESSAGES[message.message_id]) {
        VK.sendMessage(process.env.VK_USER_ID,
            "CHAT NAME: " + message.chat.title + "\n" +
            "FROM: t.me/" + message.from.username + "\n" + 
            "TIME: " + new Date(message.date * 1000) +
            "MESSAGE EDITED: \n" + MESSAGES[message.message_id] + "\n->\n" + message.text);
        MESSAGES[message.message_id] = message.text;
    } else return;
}

function photoMessageTG(message) {
    VK.sendMessage(process.env.VK_USER_ID,
        "PHOTO\n" +
        "CHAT NAME: " + message.chat.title + "\n" +
        "FROM: t.me/" + message.from.username + "\n" + 
        "TIME: " + new Date(message.date * 1000) +
        (message.forward_origin == undefined ? "" : "FORWARDED: " + message.forward_origin.chat.title == undefined ? "" : message.forward_origin.chat.title + "\nt.me/" + message.forward_origin.chat.username + "\n") +
        (message.caption == undefined ? "" : "CAPTION: \n" + message.caption));
    return;
}

function videoMessageTG(message) {
    VK.sendMessage(process.env.VK_USER_ID,
        "VIDEO\n" +
        "CHAT NAME: " + message.chat.title + "\n" +
        "FROM: t.me/" + message.from.username + "\n" + 
        "TIME: " + new Date(message.date * 1000) +
        (message.forward_origin == undefined ? "" : "FORWARDED: " + message.forward_origin.chat.title + "\nt.me/" + message.forward_origin.chat.username + "\n") +
        (message.caption == undefined ? "" : "CAPTION: \n" + message.caption));
    return;
}

function deletedMessagesTG() {
    
}

async function parseSite(ctx) {
    // try
    // {
    //     let response;
    //     if (ctx.message.text.match(/\/скрепинг\s+(\S+)/) != null)
    //         response = await unirest.get(ctx.message.text.match(/\/скрепинг\s+(\S+)/)[1]);

    //     if (response != undefined || response != null) {
    //         let page = cheerio.load(response.body);
    //         VK.sendMessage(process.env.VK_USER_ID, page('body'));
    //     }
    // }
    // catch(e)
    // {
    //     console.log(e);
    //     VK.sendMessage(process.env.VK_USER_ID, e);
    // }
}

initializeBots();