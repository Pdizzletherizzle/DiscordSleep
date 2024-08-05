//discord sleep bot verify NodeJS
require('dotenv').config();
console.log('Bot token:', process.env.DISCORD_BOT_TOKEN);  // Add this line to verify the token

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('!play ')) {
        if (message.member.voice.channel) {
            try {
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: false, // Ensure the bot is not deafened
                });

                connection.on(VoiceConnectionStatus.Ready, () => {
                    console.log('The bot has connected to the channel!');
                    const url = message.content.split(' ')[1];
                    if (ytdl.validateURL(url)) {
                        const stream = ytdl(url, { filter: 'audioonly' });
                        const player = createAudioPlayer();
                        const resource = createAudioResource(stream);
                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Playing, () => {
                            console.log('The audio is now playing!');
                        });

                        player.on(AudioPlayerStatus.Idle, () => {
                            console.log('The audio has finished playing!');
                            connection.destroy();
                        });

                        player.on('error', error => {
                            console.error('Error in audio player:', error);
                            connection.destroy();
                        });
                    } else {
                        message.reply('Please provide a valid YouTube URL.');
                        connection.destroy();
                    }
                });

                connection.on('error', error => {
                    console.error('Connection error:', error);
                });
            } catch (error) {
                console.error('Error:', error);
                message.reply('There was an error trying to play the video.');
            }
        } else {
            message.reply('You need to join a voice channel first!');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);