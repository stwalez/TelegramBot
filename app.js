require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const token = process.env.TOKEN;
const apikey = process.env.apikey;
const devmode = true;


// Select Development or Production Mode
const mode = {
    devmode : {
        polling:true
    },
    prodmode:{
        webHook: {
            port: process.env.PORT
        }
    }
}
const TelegramMode = mode.prodmode

// if(devmode){
//     const bot = new TelegramBot(token, {
//         polling: true
//     });  
// } else {
//     const bot = new TelegramBot(token, {
//          webHook: {
//              port: process.env.PORT
//          }
//     });
//     //Create an environment variable for Heroku app
//     const url = process.env.APP_URL //|| 'https://<app-name>.herokuapp.com:443';
//     //Set WebHook 
//     bot.setWebHook(`${url}/bot${token}`);
// }

const bot = new TelegramBot(token, TelegramMode);

//Create an environment variable for Heroku app
if(TelegramMode===mode.prodmode){
    const url = process.env.APP_URL //|| 'https://<app-name>.herokuapp.com:443';

    //Set WebHook 
    bot.setWebHook(`${url}/bot${token}`);
}

// In-memory storage
const URLs = [];
const URLLabels = [];
let tempSiteURL = '';
const contactnumber = {
    firstname: "Molly",
    lastname: "Sanders",
    number: "+234 701 122 3344"
}
// Listener (handler) for Greetings
let clientname = '';
bot.on('message', (msg) => {
    try{
        let clientmsg = ["hello", "hi", "heyy", "hey",];
        let contactmsg = ["my phone contact"];
        let bye = "bye";
        if (!msg.text.charAt(0).includes("/")) {
            if (!msg.reply_to_message || !msg.reply_to_message.text.includes("Hi, What's your name")) {

                if (clientmsg.includes(msg.text.toLowerCase())) {
                    bot.sendMessage(msg.chat.id, "*Hi, What's your name ?*",
                        {
                            parse_mode: "MarkDown",
                            reply_to_message_id: msg.message_id,
                            reply_markup: { force_reply: true }
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
    }
    catch(err){
        bot.sendMessage(msg.chat.id, "*Hi, Say hello first*", { parse_mode: "MarkDown" });
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
    //console.log(URLs);
    //console.log(msg);
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
                        callback_data: JSON.stringify({
                            'command': 'label',
                            'area': 'Lifestyle'
                        })
                    }, {
                        text: 'Other',
                        callback_data: JSON.stringify({
                            'command': 'label',
                            'area': 'other'
                        })
                    }
                ]]
            }
        }
    );
});

// Listener (handler) for callback data from /label command
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;

    const category = JSON.parse(callbackQuery.data);

    URLLabels.push({
        url: tempSiteURL,
        label: category.area,
    });

    tempSiteURL = '';
    bot.sendMessage(message.chat.id, `URL has been labeled with category "${category.area}"`);

});

//Listener (handler) for viewing labels
bot.onText(/\/viewlabel/, (msg, match) => {
    const chatId = msg.chat.id;
    const labelType = match.input.split(' ')[1];
    const content = URLLabels;
    console.log(content);
    //console.log(content[0]);
    //console.log(content);   
    if (labelType === undefined) {
        for (const arr of content) {
            console.log(`URL: ${arr.url} Label: ${arr.label}`)
            var UrlJson = JSON.stringify(arr.url);
            var LabelJson = JSON.stringify(arr.label);
            bot.sendMessage(
                chatId,
                `<code>URL: ${UrlJson}\nLABEL: ${LabelJson}</code>`,
                {parse_mode:'HTML',}
            )
        }
        return;
    };
}
);

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
            /movie <b>Movie Name </b> - Get Movie Info
            /phone - Access your phone number
            /Poll [1-5] - Get a Poll Style

        `, {
        parse_mode: 'HTML',
    }
    );
});

// Including a Movie API 
bot.onText(/\/movie (.+)/, (msg, match) => {
    var movie = match[1];
    var chatId = msg.chat.id;
    if (movie === undefined) {
        bot.sendMessage(
            chatId,
            'Please provide "Movie Name" after the movie command i.e. /movie Avengers!',
        );
        return;
    }
    bot.sendMessage(chatId, `Looking for the movie titled ${movie}...`);
    getMovie = async () => {
        try {
            const response = await axios.get(`https://www.omdbapi.com/?apikey=${apikey}&t=${movie}`);

            var res = response.data;
            bot.sendPhoto(chatId, res.Poster, { caption: `Result:\nTitle: ${res.Title} \nYear: ${res.Year} \nRated: ${res.Rated} \nReleased: ${res.Released} \nPlot: ${res.Plot}` })
        } catch (error) {
            console.error(error);
        }
    }
    getMovie();
});

// Set up Poll
bot.onText(/\/Poll (.+)/, (msg, match) => {
    const pollquestion = Number(match[1])
    if(pollquestion === ""){
        bot.sendMessage(msg.chat.id,'Please type a digit within 1 to 5 after the /Poll tag to generate a Poll Question i.e <i>/Poll 1</i>',
        {
            parse_mode:'HTML'
        })
    }
    switch(pollquestion){
        case 1:
            bot.sendPoll(msg.chat.id, 'Who is the Founder of the Telegram app?', [
                "Pavel Durov",
                "Mark Zuckerberg"
            ],
            {
                is_anonymous: "true", //<--- This defaults to true
                type:"regular",  //<--- This defaults to regular
            });
            break;
        case 2:
            bot.sendPoll(msg.chat.id, 'Who is the Founder of the Telegram app?', [
                "Pavel Durov",
                "Mark Zuckerberg"
            ],
            {
                is_anonymous: "false", 
                type:"regular",
            });
            break;    
        case 3:
            bot.sendPoll(msg.chat.id, 'Who is the Founder of the Telegram app?', [
                "Pavel Durov",
                "Mark Zuckerberg"
            ],
            {
                is_anonymous: "true",
                type:"quiz",
                correct_option_id: "1"
            });
            break;
        case 4:
            bot.sendPoll(msg.chat.id, 'Who is the Founder of the Telegram app?', [
                "Pavel Durov",
                "Mark Zuckerberg"
            ],
            {
                is_anonymous: "false",
                type:"quiz",
                correct_option_id: "1"
            });
            break;
        case 5:
            bot.sendPoll(msg.chat.id, 'What are the names of the founder of the Telegram app?', [
                "Pavel",
                "Durov",
                "Mark Zuckerberg"
            ],
            {
                is_anonymous: "false",
                allows_multiple_answers: "true",    
            });
            break;
        default:
            bot.sendMessage(msg.chat.id,'Please type a digit within 1 to 5 after the /Poll tag to generate a Poll Question i.e <i>/Poll 1</i>',
        {
            parse_mode:'HTML'
        });
    }
});

// Log Errors
bot.on("polling_error", (err) => console.log(err));
