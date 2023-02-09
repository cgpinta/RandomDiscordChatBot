# Random Discord Chat Bot
This is a Discord chat bot that will, in short, respond with a random message from a text channel you specify.
Most of the time its responses won't make any sense(they are randomly chosen) but, when it responds accordingly, it can be pretty funny.

When the bot starts it will:
1. scan a specified channel for all its messages
2. respond to any messages that include it's name, Matt, in them. (this can be changed by changing the botname variable in bot.js)

## Setup
1. Open bot.js and change botname to whatever you would like
2. Create a file named "config.json" that is formatted the following way:
      {
        "token":	"(Discord bot token goes here)",
        "clientId":	"(Discord bot client ID goes here)"
      }
3. In a text channel, use the command: /setchannels (talkchannel) (readchannel)
      - talkchannel is the channel that Matt will be able to respond to people in
      - readchannel is the channel that Matt will read all of its messages from
4. Matt will then scan all messages in readchannel using a separate thread
