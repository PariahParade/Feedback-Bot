const Discord = require('discord.js');
const client = new Discord.Client();

const { prefix, token } = require('./config.json');
const emojiCharacters = require('./emojiCharacters');

process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
	client.user.setPresence({
        game: { 
            name: 'them DM\'s',
            type: 'LISTENING'
        }
    })
});

client.on('message', message => {
    // Ignore all text from bots to prevent loops
    if (message.author.bot) return;

    if (message.channel.type == "dm") {
        const officialBizzChannel = client.channels.find(channel => channel.name === "official-bizz");

        // Do nothing if the channel wasn't found on this server
        if (!officialBizzChannel) {
            console.log('Could not find official-biz channel');
            console.log(JSON.stringify(client.channels, null, 2));
            message.channel.send('An error occured in connecting to the Officer chat channel. This is either a fluke or I\'m currently broken. Send feedback normally?');
            return;
        }

        // Use reactions to poll the user for whether or not they wish this to be anonymous
        var anonymousQuestion = 'Would you like this feedback to be anonymous? Use the reactions to choose. If there is no response within 60 seconds, the feedback will default to anonymous';
        var replyToQuestion = '';

        message.channel.send(anonymousQuestion).then(myMessage => {
            // Always want them in the order: N | Y
            myMessage.react(emojiCharacters.n).then(myMessage.react(emojiCharacters.y));
            
            const filter = (reaction, user) => {
                return (reaction.emoji.name === emojiCharacters.y || reaction.emoji.name === emojiCharacters.n) && user.id === message.author.id;
            };
            
            const collector = myMessage.createReactionCollector(filter, { time: 60000 });
            
            collector.on('collect', (reaction, reactionCollector) => {
                console.log(`Collected ${reaction.emoji.name}`);
                switch (reaction.emoji.name){
                    // If they vote Y, send feedback without author
                    case emojiCharacters.y:
                        message.channel.send('Sending feedback anonymously.');
                        officialBizzChannel.send(`New feedback from Anonymous: \n\`\`\`${message}\`\`\``);
                        break;
                    // Else add author
                    case emojiCharacters.n:
                        message.channel.send('Sending feedback.');
                        officialBizzChannel.send(`New feedback from ${message.author}: \n\`\`\`${message}\`\`\``);
                        break;
                }
            });
            
            // On Timeout
            collector.on('end', collected => {
                //console.log(`Collected ${collected.size} items`);
                if (collected.size === 0) {
                    message.channel.send('Response window has timed out. Defaulting to sending feedback anonymously.');
                    officialBizzChannel.send(`New feedback from Anonymous: \n\`\`\`${message}\`\`\``);
                }
            });
        });

        return;
    }
});

client.login(token);