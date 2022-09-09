const Discord = require('discord.js');
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, TextChannel, Partials, ButtonBuilder, SlashCommandBuilder, Routes, REST } = require('discord.js');
const client = new Discord.Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers
	]
});
const { MessageEmbed } = require('discord.js');
//const { fs } = require('fs');
const { token } = require('./config.json');
const { clientId } = require('./config.json');

client.login(token);
var randomMessage;
var randOn = false;

var userNames = [];
var userIDs = [];

//let talkChannel = new Discord.TextChannel;
var readChannel;
var talkChannel;

var prefix = "MM!";
var botName = "matt";

var lowTime = 5;
var highTime = 10;
var timer; //set min and max in seconds for random messages


const fileName = "filteredmessages.txt";
const outputFile = "whatmattsees.txt";
var messages = [];
var wrongMessages = [];

let timeReset;
var acceptingInput = true;

var randAttempts = 0;


async function main() {
	console.log("main running");

	const commands = [
		new SlashCommandBuilder()
			.setName('setchannels')
			.setDescription('Sets the channels inwhich Matt will respond and read messages from')
			.addChannelOption((channel) => channel.setName('talkchannel').setDescription('Sets the channel in which Matt will talk in.').setRequired(true))
			.addChannelOption((channel) => channel.setName('readchannel').setDescription('Sets the channel in which Matt will read messages from.').setRequired(true)),
	].map(command => command.toJSON())


	const rest = new REST({ version: '10' }).setToken(token);
	await rest.put(
		Routes.applicationCommands(clientId),
		{ body: commands }
	);
}


client.on("ready", () => {
	console.log("Bot online and ready on " + client.guilds.size + " server(s).");
	main();
});

client.on('messageCreate', (msg) => {
	if(msg.author.bot || !acceptingInput){
		console.log("Can't respond to:" + msg.content);
		return;
	}

	console.log("Responding to:" + msg.content);
	timer = [lowTime, highTime];
	var command = msg.content.split(" ");

    if (talkChannel != undefined && msg.channel.id == talkChannel.id) {
        if (msg.content.toLowerCase().startsWith(botName)) {
            randomMsg(msg, true, false);
        }
	}
	else if (readChannel != undefined && msg.channel.id == readChannel.id) {
		if (!msg.content.toLowerCase().startsWith(botName)) {
			messages.push(msg);
			console.log("Added \"" + msg.content + "\" to the message list");
        }
    }
	else{
		console.log("did nothing");
	}
	console.log("Responded to:" + msg.content);


});

client.on('interactionCreate', interaction => {
	console.log(interaction.command);

	switch (interaction.commandName) {
		case "setchannels":
			if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				interaction.reply({ content: "You can not use this command.", ephemeral: true });
				return;
            }
			talkChannel = interaction.options.getChannel('talkchannel');
			readChannel = interaction.options.getChannel('readchannel');
			console.log("talkchannel set to:" + talkChannel.name + " readchannel set to:" + readChannel.name);

			fetchAllMessages(readChannel);
			interaction.reply({ content: "talkchannel set to:" + talkChannel.name + " readchannel set to:" + readChannel.name, ephemeral: true });
			break;
    }
});




async function fetchAllMessages(curChannel) {
	//acceptingInput = false;
	//curInteraction.reply({ content: "hold on..." + curInteraction.channel.name, ephemeral: true });
	console.log("Updating Messages");
	const channel = client.channels.cache.get(curChannel.id.toString());
	var loadingTime = 0;
	//let messages = [];

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	while (message) {
		loadingTime++;
		console.log("	Getting Messages:"+loadingTime);
		await channel.messages
			.fetch({ limit: 100, before: message.id })
			.then(messagePage => {
				messagePage.forEach(msg => messages.push(msg));

				// Update our message pointer to be last message in page of messages
				message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
			})
	}

	console.log("		Erasing Mattssages");
	for (let i = 0; i < messages.length; i++) {
		if (messages[i].content.toLowerCase().startsWith("Matt") || messages[i].author.bot || messages[i].content.startsWith(prefix)) {
			console.log("UserID:"+messages[i].author.id+", BotID:"+client.user.id+", Deleting:"+messages[i].content);
			messages.splice(i-1, 1);
		}
	}
	//console.log(messages[100].content);
	console.log("Messages Updated");
	//curInteraction.reply({ content: "alright, I'll talk here for now." + interaction.channel.name, ephemeral: true });
	acceptingInput = true;
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}




function randomMsg(msg, isReply, isRepeating) {
	if (randAttempts > 1000) {
		msg.channel.send("ERROR I can't think right now");
		return;
	}

	var attempts = 0;
	var rand = randomIntFromInterval(0, messages.length - 1);
	console.log("Trying rand: " + rand);
	while (wrongMessages.includes(rand)) {
		if (attempts > 10) {
			for (let i = 0; i < wrongMessages.length; i++) {
				console.log(wrongMessages[i]);
			}
			return;
		}
		rand = randomIntFromInterval(0, messages.length - 1);
		console.log("Trying rand: " + rand);
		attempts++;
	}
	console.log("Chosen rand: " + rand);

	console.log("messages length:" + messages.length);

	console.log("ID:" + rand + ", bot? " + messages[rand].author.bot + ", Message: " + messages[rand].content + ", From User: " + messages[rand].author.name);
	if (!messages[rand].author.bot && !(messages[rand].content.toLowerCase().startsWith(botName)) && !(messages[rand].content.startsWith(prefix)) && messages[rand].content.length > 0) {
		if (isReply) {
			console.log("Replying:" + messages[rand].content);
			msg.reply(messages[rand].content);
		}
		else {
			console.log("Sending:" + messages[rand].content);
			msg.channel.send(messages[rand].content);
		}
	}
	else {
		wrongMessages.push(rand);
		randAttempts++;
		randomMsg(msg, isReply, isRepeating);
	}
}


function initializeTime() {
	timeReset = new Date();
	timeReset = new Date(timeReset.getTime() + 8.64e+7);
}

function doMessagesNeedUpdate() {
	let timeNow = new Date();
	if (timeNow.getTime() > timeReset.getTime()) {
		fetchAllMessages();
	}
}