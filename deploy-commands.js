const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
//const { clientId, guildId, token } = require('./config.json');
const { token } = require('./token.json');

const commands = [
	new SlashCommandBuilder().setName('help').setDescription('Show bot commands with explanations'),
	new SlashCommandBuilder().setName('settalkchannel').setDescription('Sets the channel inwhich Matt will respond'),
	new SlashCommandBuilder().setName('setreadchannel').setDescription('Sets the channel inwhich Matt will read messages from'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);