require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;

// Created instance of TelegramBot
const bot = new TelegramBot(token, {
    polling: true
});

// In-memory storage
const URLs = [];
const URLLabels = [];
let tempSiteURL = '';
const contactnumber = {
    firstname: "Molly",
    lastname: "Sanders",
    number: "+234 701 122 3344"
}
let clientname = '';

// Listener (handler) for Greetings
bot.on('message', (msg) => {
    let clientmsg = ["hello", "hi", "heyy", "hey",];
    let contactmsg = ["my phone contact"];
    let bye = "bye";
    //console.log(msg);
    if (!msg.text.charAt(0).includes("/")) {
        if (!msg.reply_to_message || !msg.reply_to_message.text.includes("Hi, What's your name")) {
            
            if (clientmsg.includes(msg.text.toLowerCase())) {
                bot.sendMessage(msg.chat.id, "*Hi, What's your name ?*", 
                {   parse_mode: "MarkDown", 
                    reply_to_message_id: msg.message_id, 
                    reply_markup:{force_reply:true} 
                });
            }
            if (msg.text.toLowerCase().includes(contactmsg)) {
                bot.sendContact(msg.chat.id, contactnumber.number, contactnumber.firstname, { last_name: contactnumber.lastname })
            }
            if (clientname && msg.text.toLowerCase().includes(bye)) {
                bot.sendMessage(msg.chat.id, `Have a nice day ${clientname}!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
            }
            else if (!clientname && msg.text.toLowerCase().includes(bye)) {
                bot.sendMessage(msg.chat.id, `Have a nice day *${msg.from.first_name}!*`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
            }
            else if (!clientmsg.includes(msg.text.toLowerCase())) {
                bot.sendMessage(msg.chat.id, "*Hi, Say hello first*", { parse_mode: "MarkDown" });
            }
        }
        else if (msg.reply_to_message.text.includes("Hi, What's your name ?")) {
            clientname = msg.text
            bot.sendMessage(msg.chat.id,
                `  
                Oh hello, *${clientname}!*  
                Click /start to know what's up! 🙂
                `,
                { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        }
      
    }
});

// Listener (handler) for telegram's /bookmark event
bot.onText(/\/bookmark/, (msg, match) => {
    console.log(match);
    const chatId = msg.chat.id;
    const url = match.input.split(' ')[1];
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message.. node telegram bot api addition

    if (url === undefined) {
        bot.sendMessage(
            chatId,
            'Please provide URL of article!',
        );
        return;
    }

    URLs.push(url);

    bot.sendMessage(
        chatId,
        'URL has been successfully saved!',
    );
    console.log(URLs);
    console.log(msg);
});

// Listener (handler) for telegram's /label event
bot.onText(/\/label/, (msg, match) => {
    const chatId = msg.chat.id;
    const url = match.input.split(' ')[1];

    if (url === undefined) {
        bot.sendMessage(
            chatId,
            'Please provide URL of article!',
        );
        return;
    }

    tempSiteURL = url;
    bot.sendMessage(
        chatId,
        'URL has been successfully saved!',
        {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: 'Development',
                        callback_data: JSON.stringify({
                            'command': 'label',
                            'area': 'development'
                        })
                    }, {
                        text: 'Lifestyle',
                        callback_data: 'lifestyle'
                    }, {
                        text: 'Other',
                        callback_data: 'other'
                    }
                ]]
            }
        }
    );
});

// Listener (handler) for callback data from /label command
/* bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;

    const category = JSON.parse(callbackQuery.data);

    URLLabels.push({
        url: tempSiteURL,
        label: category.area,
    });

    tempSiteURL = '';
    console.log(`Command is ${category.area}` + category.area);
    bot.sendMessage(message.chat.id, `URL has been labeled with category "${category.area}"`);
});
 */
// Listener (handler) for showcasing different keyboard layout
bot.onText(/\/keyboard/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Alternative keybaord layout', {
        'reply_markup': {
            //'keyboard': [['Sample text', 'Second sample'], ['Keyboard'], ['I\'m robot']],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        }
    });
});



// Inline keyboard options
const inlineKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: 'YES',
                    callback_data: JSON.stringify({
                        'command': 'mycommand1',
                        'answer': 'YES'
                    })
                },
                {
                    text: 'NO',
                    callback_data: JSON.stringify({
                        'command': 'mycommand1',
                        'answer': 'NO'
                    })
                },
            ]
        ]
    }
};

// Listener (handler) for showcasing inline keyboard layout
bot.onText(/\/inline/, (msg) => {
    bot.sendMessage(msg.chat.id, 'You have to agree with me, OK?', inlineKeyboard);
});

// Keyboard layout for requesting phone number access
const requestPhoneKeyboard = {
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [[{
            text: "My phone number",
            request_contact: true
        }], ["Cancel"]]
    }
};
bot.on("polling_error", (err) => console.log(err));

// Listener (handler) for retrieving phone number
bot.onText(/\/phone/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Can we get access to your phone number?', requestPhoneKeyboard);

});

// Handler for phone number request when user gives permission
bot.on('contact', async (msg) => {
    const phone = msg.contact.phone_number;
    bot.sendMessage(msg.chat.id, `Phone number saved: ${phone}`);
})

// Listener (handler) for telegram's /start event
// This event happened when you start the conversation with both by the very first time
// Provide the list of available commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
        chatId,
        `
            Welcome at <b>A Testing Bot</b>, thank you for using my service
      
            Available commands:
        
            /bookmark <b>URL</b> - save interesting article URL
        `, {
        parse_mode: 'HTML',
    }
    );
});


// Matches /editable
bot.onText(/\/editable/, function onEditableText(msg) {
    console.log(msg)
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Edit Text',
              // we shall check for this value when we listen
              // for "callback_query"
              callback_data: 'edit'
            }
          ]
        ]
      }
    };
    bot.sendMessage(msg.from.id, 'Original Text', opts);
  });
  
  
  // Handle callback queries
  bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    };
    let text;
  
    if (action === 'edit') {
      text = 'Edited Text';
    }
  
    bot.editMessageText(text, opts);
  });
