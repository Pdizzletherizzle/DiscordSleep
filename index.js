//discord sleep bot verify NodeJS
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');
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
            const url = message.content.split(' ')[1];
            if (ytdl.validateURL(url)) {
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: false,
                });

                connection.on(VoiceConnectionStatus.Ready, async () => {
                    console.log('The bot has connected to the channel!');
                    try {
                        const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
                        const resource = createAudioResource(stream);
                        const player = createAudioPlayer();
                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Playing, () => {
                            console.log('The audio is now playing!');
                        });

                        player.on(AudioPlayerStatus.Idle, () => {
                            console.log('The audio has finished playing!');
                            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                connection.destroy();
                            }
                        });

                        player.on('error', error => {
                            console.error('Error in audio player:', error);
                            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                connection.destroy();
                            }
                        });
                    } catch (error) {
                        console.error('Error during playback:', error);
                        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                            connection.destroy();
                        }
                    }
                });

                connection.on('error', error => {
                    console.error('Connection error:', error);
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                    }
                });
            } else {
                message.reply('Please provide a valid YouTube URL.');
            }
        } else {
            message.reply('You need to join a voice channel first!');
        }
    }

    if (message.content === '!stop') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('Stopped playing and left the voice channel.');
        } else {
            message.reply('I am not in a voice channel.');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
///