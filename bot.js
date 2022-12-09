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
//permissions integer: 431644736576

const { MessageEmbed } = require('discord.js');
//const { fs } = require('fs');
const { token } = require('./config.json');
const { clientId } = require('./config.json');
const fs = require('fs');

client.login(token);
var randomMessage;
var randOn = false;

var userNames = [];
var userIDs = [];

//let talkChannel = new Discord.TextChannel;
var readChannel;
var talkChannel;

var responseMode;

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
			.addChannelOption((channel) => channel.setName('talkchannel')
				.setDescription('Sets the channel in which Matt will talk in.')
				.setRequired(true))
			.addChannelOption((channel) => channel.setName('readchannel')
				.setDescription('Sets the channel in which Matt will read messages from.')
				.setRequired(true)),
		new SlashCommandBuilder()
			.setName('setresponsemode')
			.setDescription('Sets which messages Matt will respond to')
			.addStringOption((mode) => mode.setName('responsemode')
				.setDescription('Sets when Matt will respond to a message with his name in it.').setRequired(true)
				.addChoices(
					{ name: 'Start', value: 'start' },
					{ name: 'Start and End', value: 'both' },
					{ name: 'Contains', value: 'anywhere' },
				)),
		new SlashCommandBuilder()
			.setName('sendmessage')
			.setDescription('Sends a message as Matt')
			.addStringOption((str) => str.setName('message')
				.setDescription('What will Matt say.').setRequired(true)
				.setRequired(true))
			.addChannelOption((channel) => channel.setName('channel')
				.setDescription('Which channel to send the message in.')
				.setRequired(true)),
		new SlashCommandBuilder()
			.setName('sendreply')
			.setDescription('Sends a reply as Matt')
			.addStringOption((str) => str.setName('message')
				.setDescription('What will Matt say.').setRequired(true)
				.setRequired(true))
			.addChannelOption((channel) => channel.setName('channel')
				.setDescription('Which channel is the message in.')
				.setRequired(true))
			.addStringOption((id) => id.setName('messageid')
				.setDescription('ID of message Matt will reply to.').setRequired(true)
				.setRequired(true)),
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
        if (isUsableMessage(msg)) {
            randomMsg(msg, true, false);
        }
	}
	else if (readChannel != undefined && msg.channel.id == readChannel.id) {
		if (isUsableMessage(msg)) {
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

			interaction.reply({ content: "scanning through " + readChannel.name, ephemeral: true });
			fetchAllMessages(readChannel);
			//interaction.editReply({ content: "talkchannel set to:" + talkChannel.name + " readchannel set to:" + readChannel.name, ephemeral: true });
			break;
		case "setresponsemode":
			if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				interaction.reply({ content: "You can not use this command.", ephemeral: true });
				return;
			}
			const getRespMode = interaction.options.getString('mode');
			responseMode = getRespMode;

			console.log("Response mode set to:" + responseMode);

			interaction.reply({ content: "Response mode set to:" + responseMode, ephemeral: true });
			break;
		case "sendmessage":
			if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				interaction.reply({ content: "You can not use this command.", ephemeral: true });
				return;
			}
			sendCustomMessage(interaction.options.getString('message'), interaction.options.getChannel('channel'))
			interaction.reply({ content: "Message sent", ephemeral: true });
			break;
		case "sendreply":
			if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				interaction.reply({ content: "You can not use this command.", ephemeral: true });
				return;
			}
			sendCustomReply(interaction.options.getString('message'), interaction.options.getChannel('channel'), interaction.options.getString('messageId'))
			interaction.reply({ content: "Replay sent", ephemeral: true });
			break;
    }
});




async function fetchAllMessages(curChannel) {
	console.log("Updating Messages");
	const channel = client.channels.cache.get(curChannel.id.toString());
	var loadingTime = 0;

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	var startTime = Date.now;
	while (message) {
		var currentTime = Date.now - startTime;
		console.log("	Getting Messages:"+messages.length+"		"+currentTime.toString());
		await channel.messages
			.fetch({ limit: 100, before: message.id })
			.then(messagePage => {
				messagePage.forEach(msg => {
					if (isUsableMessage(msg)) {
						messages.push(msg);
						console.log("added: " +msg.author.name+" \""+msg.content+"\"");
					}
					else {
						console.log("skipped: " + msg.content);
                    }
				});

				// Update our message pointer to be last message in page of messages
				message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
			}
		)
	}
	console.log("Messages Updated");
	
	console.log("Messages saved locally");
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
	if (isUsableMessage(messages[rand])) {
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

function sendCustomMessage(str_message, channel){
	channel.send(str_message);
}

function isUsableMessage(message) {
	if (!message.author.bot && !(message.content.toLowerCase().includes(botName)) && !(message.content.startsWith("/")) && message.content.length > 0) {
		return true;
	}
	return false;
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

function saveArrayToFile(array, filePath, separator) {
	// convert the array to a string with each item separated by the specified separator character
	const arrayAsString = array.join(separator);

	// write the string to the file
	fs.writeFileSync(filePath, arrayAsString);
}

function loadArrayFromFile(filePath, separator) {
	// read the file contents as a string
	const arrayAsString = fs.readFileSync(filePath, 'utf8');

	// split the string into an array by splitting on the specified separator character
	return arrayAsString.split(separator);
}