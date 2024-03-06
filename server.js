require('dotenv').config();

const tmi = require('tmi.js');
const { CronJob } = require('cron');

const regexpCommand = new RegExp(/^!([\u4e00-\u9fa5a-zA-Z0-9]+)(?:\W+)?(.*)?/);
//const regexpCommand = new RegExp(/^![^\s]+(?:\W+)?(.*)?/);
//const regexpCommand = new RegExp(/^![^\s]+(?:\s+)?(.*)?/u);



const commands = {
    test: {
        response: (user) => `User ${user} was just upvoted`
    },
    喵喵: {
        response: (user, count) => `Custom message for ${user}. This is your ${count} time using the command.`
    },
    hello: {
        response: (user) =>[
            `Hello, ${user}!`,
            'Nice to meet you.',
            'Hope you have a good day.'
        ]
            
    },
    dice: {
        response: (user) => {
            const possibleResponses = ['蘋果', '香蕉', '橘子', '西瓜', '葡萄'];
            const combinedResponses = [];

            // Generate 10 random responses
            for (let i = 0; i < 10; i++) {
                const randomIndex = Math.floor(Math.random() * possibleResponses.length);
                combinedResponses.push(possibleResponses[randomIndex]);
            }

            const responseWithUser = `${user} → ${combinedResponses.join(', ')}`;
            
            return responseWithUser;
        }
    }
};

const userCommandCount = {}; // To store the command count for each user

const resetCommandCount = () => {
    Object.keys(userCommandCount).forEach((user) => {
        userCommandCount[user] = 0;
    });
    console.log('Command counts reset.');
};

// Schedule a daily reset at midnight (adjust timezone if needed)
const dailyResetJob = new CronJob('0 0 * * *', resetCommandCount, null, true, 'UTC');
dailyResetJob.start();

const client = new tmi.Client({
    connection: {
        reconnect: true
    },
    channels: ['mayshow511','hyunwoo901'],
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    }
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    const isNotBot = tags.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME;

    if (!isNotBot) 
    {
        return;
    }


    const matchResult  = message.match(regexpCommand);
    const [raw, command, argument] = matchResult  || [];
    const { response } = commands[command] || {};

    if (matchResult ) {
        

        

        const sendResponseWithDelay = (responses, index = 0) => {
            if (index < responses.length) {
                const currentResponse = responses[index];

                if (typeof currentResponse === 'string' && currentResponse.trim() !== '') {
                    client.say(channel, currentResponse);
                }

                setTimeout(() => sendResponseWithDelay(responses, index + 1), 1500); // 0.5 second delay
            }
        };
    



        if (typeof response === 'function') {
            if (command === '喵喵') {
                // Initialize user command count if not exists
                userCommandCount[tags.username] = userCommandCount[tags.username] || 0;

                // Check and update user command count
                userCommandCount[tags.username] += 1;

                // Check if user has not exceeded the limit (5 times)
                if (userCommandCount[tags.username] <= 5) {
                    client.say(channel, response(tags.username, userCommandCount[tags.username]));
                }
            } 
            
            
            if (Array.isArray(response(tags.username))) {
                response(tags.username).forEach((line, index) => {
                    // Send each line separately
                    setTimeout(() => {
                        client.say(channel, line);
                    },index * 1000);
                    
                });
            } else {
                // Send the single response as usual
                client.say(channel, response(tags.username));
            }
            
            
            




        } else if (Array.isArray(response)) {
            response.forEach((line) => {
                client.say(channel, line);
            });
                




        } else if (typeof response === 'string') {
            client.say(channel, response);
        }






    }
    
    console.log(`${tags['display-name']}: ${message}`);
});
