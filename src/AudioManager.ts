import Phaser from 'phaser';

export class AudioManager {
    private static instance: AudioManager;
    private scene: Phaser.Scene;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private shortClips: string[] = [];
    private isPlayingTitle: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        AudioManager.instance = this;

        // List of short audio clips for microgames
        this.shortClips = [
            'short1', 'short2', 'short3', 'short4', 'short5', 'short6',
            'short7'
        ];
    }

    static getInstance(scene?: Phaser.Scene): AudioManager {
        if (!AudioManager.instance && scene) {
            AudioManager.instance = new AudioManager(scene);
        }
        return AudioManager.instance;
    }

    preloadAudio(scene: Phaser.Scene) {
        // Load title music
        scene.load.audio('titleMusic', 'audio/theme.mp3');

        // Load transition music
        scene.load.audio('transitionMusic', 'audio/transition_long.mp3');

        // Load all short clips
        for (let i = 1; i <= 7; i++) {
            scene.load.audio(`short${i}`, `audio/${i}.mp3`);
        }
    }

    playTitleMusic() {
        // Prevent multiple instances
        if (this.isPlayingTitle && this.currentMusic) {
            return;
        }

        this.stopCurrentMusic();

        try {
            // Check if audio context needs to be resumed
            if ('context' in this.scene.sound && (this.scene.sound as any).context?.state === 'suspended') {
                (this.scene.sound as any).context.resume().then(() => {
                    this.actuallyPlayTitleMusic();
                }).catch((error: any) => {
                    console.error('Failed to resume audio context:', error);
                });
            } else {
                // Context is already running, play immediately
                this.actuallyPlayTitleMusic();
            }
        } catch (error) {
            console.error('Error in playTitleMusic:', error);
        }
    }

    private actuallyPlayTitleMusic() {
        try {
            // Double check we don't already have music
            if (this.currentMusic) {
                this.currentMusic.stop();
                this.currentMusic.destroy();
                this.currentMusic = null;
            }

            this.currentMusic = this.scene.sound.add('titleMusic', {
                loop: true,
                volume: 0.5
            });

            // Explicitly set volume after creation
            (this.currentMusic as any).setVolume(0.5);

            const playResult = this.currentMusic.play();

            // Set flag if playing
            if (playResult !== false) {
                this.isPlayingTitle = true;
            }
        } catch (error) {
            console.error('Error playing title music:', error);
        }
    }

    playTransitionMusic(duration: number) {
        this.stopCurrentMusic();
        this.currentMusic = this.scene.sound.add('transitionMusic', {
            volume: 0.5
        });

        // Play only for the duration of the transition
        this.currentMusic.play();

        // Stop after the specified duration
        this.scene.time.delayedCall(duration, () => {
            if (this.currentMusic && this.currentMusic.key === 'transitionMusic') {
                this.currentMusic.stop();
            }
        });
    }

    playRandomShortClip(gameDuration: number) {
        this.stopCurrentMusic();

        // Select a random short clip
        const clipKey = Phaser.Utils.Array.GetRandom(this.shortClips);

        this.currentMusic = this.scene.sound.add(clipKey, {
            volume: 0.5
        });

        this.currentMusic.play();

        // Stop the music when the game ends
        this.scene.time.delayedCall(gameDuration, () => {
            if (this.currentMusic && this.currentMusic.key === clipKey) {
                this.currentMusic.stop();
            }
        });
    }

    stopCurrentMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
            this.isPlayingTitle = false;
        }
    }

    fadeOutMusic(duration: number = 300) {
        if (this.currentMusic) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: duration,
                onComplete: () => {
                    this.stopCurrentMusic();
                }
            });
        }
    }

    setVolume(volume: number) {
        if (this.currentMusic) {
            (this.currentMusic as any).volume = volume;
        }
    }
} 