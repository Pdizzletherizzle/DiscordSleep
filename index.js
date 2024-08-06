require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

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
        const url = message.content.split(' ')[1];
        if (ytdl.validateURL(url)) {
            if (message.member.voice.channel) {
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                    selfDeaf: false,
                });

                connection.on(VoiceConnectionStatus.Ready, async () => {
                    console.log('The bot has connected to the channel!');
                    try {
                        console.log('Attempting to create audio stream...');
                        const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
                        console.log('Audio stream created.');
                        const resource = createAudioResource(stream);
                        console.log('Audio resource created.');
                        const player = createAudioPlayer();
                        console.log('Audio player created.');

                        player.play(resource);
                        connection.subscribe(player);
                        console.log('Player subscribed to connection.');

                        player.on(AudioPlayerStatus.Playing, () => {
                            console.log('The audio is now playing!');
                        });

                        player.on(AudioPlayerStatus.Idle, () => {
                            console.log('The audio has finished playing!');
                            connection.destroy();
                            console.log('Connection destroyed.');
                        });

                        player.on('error', error => {
                            console.error('Error in audio player:', error);
                            console.log('Connection state:', connection.state.status);
                            if (error.message.includes('Status code: 410')) {
                                console.log('The requested video is no longer available.');
                            }
                            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                connection.destroy();
                                console.log('Connection destroyed due to error.');
                            }
                        });

                    } catch (error) {
                        console.error('Error during playback:', error);
                        console.log('Connection state:', connection.state.status);
                        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                            connection.destroy();
                            console.log('Connection destroyed due to error in try block.');
                        }
                    }
                });

                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    console.log('Disconnected from the channel.');
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                        console.log('Connection destroyed due to disconnection.');
                    }
                });

                connection.on('error', error => {
                    console.error('Connection error:', error);
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                        console.log('Connection destroyed due to connection error.');
                    }
                });
            } else {
                message.reply('You need to join a voice channel first!');
                console.log('User is not in a voice channel.');
            }
        } else {
            message.reply('Please provide a valid YouTube URL.');
            console.log('Invalid YouTube URL provided.');
        }
    }

    if (message.content.startsWith('!playfile ')) {
        const number = parseInt(message.content.split(' ')[1], 10);
        if (number >= 1 && number <= 5) {
            const filePath = path.join(__dirname, 'audio', `file${number}.mp3`);  // Assuming your files are named file1.mp3, file2.mp3, etc.
            if (fs.existsSync(filePath)) {
                if (message.member.voice.channel) {
                    const connection = joinVoiceChannel({
                        channelId: message.member.voice.channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator,
                        selfDeaf: false,
                    });

                    connection.on(VoiceConnectionStatus.Ready, () => {
                        console.log('The bot has connected to the channel!');
                        try {
                            const resource = createAudioResource(filePath);
                            const player = createAudioPlayer();
                            player.play(resource);
                            connection.subscribe(player);

                            player.on(AudioPlayerStatus.Playing, () => {
                                console.log('The audio is now playing!');
                            });

                            player.on(AudioPlayerStatus.Idle, () => {
                                console.log('The audio has finished playing!');
                                connection.destroy();
                                console.log('Connection destroyed.');
                            });

                            player.on('error', error => {
                                console.error('Error in audio player:', error);
                                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                    connection.destroy();
                                    console.log('Connection destroyed due to error.');
                                }
                            });

                        } catch (error) {
                            console.error('Error during playback:', error);
                            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                connection.destroy();
                                console.log('Connection destroyed due to error in try block.');
                            }
                        }
                    });

                    connection.on('error', error => {
                        console.error('Connection error:', error);
                        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                            connection.destroy();
                            console.log('Connection destroyed due to connection error.');
                        }
                    });
                } else {
                    message.reply('You need to join a voice channel first!');
                    console.log('User is not in a voice channel.');
                }
            } else {
                message.reply('The requested file does not exist.');
                console.log('The requested file does not exist:', filePath);
            }
        } else {
            message.reply('Please provide a number between 1 and 5.');
            console.log('Invalid number provided.');
        }
    }

    if (message.content === '!stop') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('Stopped playing and left the voice channel.');
            console.log('Connection destroyed on stop command.');
        } else {
            message.reply('I am not in a voice channel.');
            console.log('Stop command received but bot is not in a voice channel.');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);




///v4