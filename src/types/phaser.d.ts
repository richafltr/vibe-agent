declare module 'phaser' {
    export default class Scene {
        add: Phaser.GameObjects.GameObjectFactory;
        input: Phaser.Input.InputPlugin;
        time: Phaser.Time.Clock;
        physics: Phaser.Physics.Arcade.ArcadePhysics;
        cameras: Phaser.Cameras.Scene2D.CameraManager;
        tweens: Phaser.Tweens.TweenManager;
    }

    export namespace GameObjects {
        interface GameObjectFactory {
            rectangle(x: number, y: number, width: number, height: number, color?: number): Rectangle;
            circle(x: number, y: number, radius: number, color?: number): Arc;
            ellipse(x: number, y: number, width: number, height: number, color?: number): Ellipse;
            text(x: number, y: number, text: string, style?: any): Text;
            container(x: number, y: number): Container;
            graphics(): Graphics;
        }

        class GameObject {
            x: number;
            y: number;
            setPosition(x: number, y: number): this;
            setRotation(angle: number): this;
            setAlpha(alpha: number): this;
            setOrigin(x: number, y?: number): this;
            destroy(): void;
        }

        class Rectangle extends GameObject {
            setDisplaySize(width: number, height: number): this;
        }

        class Arc extends GameObject {}
        class Ellipse extends GameObject {}
        
        class Text extends GameObject {
            setText(text: string): this;
        }

        class Container extends GameObject {
            add(items: GameObject[]): this;
        }

        class Graphics extends GameObject {
            clear(): this;
            lineStyle(width: number, color: number, alpha?: number): this;
            beginPath(): this;
            moveTo(x: number, y: number): this;
            lineTo(x: number, y: number): this;
            strokePath(): this;
        }
    }

    export namespace Input {
        interface InputPlugin {
            keyboard: Keyboard.KeyboardPlugin;
            on(event: string, callback: Function, context?: any): void;
            removeAllListeners(): void;
        }

        class Pointer {
            x: number;
            y: number;
        }

        namespace Keyboard {
            interface KeyboardPlugin {
                on(event: string, callback: Function, context?: any): void;
                removeAllListeners(): void;
            }
        }
    }

    export namespace Math {
        class Vector2 {
            constructor(x: number, y: number);
            x: number;
            y: number;
        }
    }

    export namespace Time {
        interface Clock {
            addEvent(config: {
                delay: number;
                callback: Function;
                callbackScope?: any;
                loop?: boolean;
            }): TimerEvent;
            delayedCall(delay: number, callback: Function, args?: any[], scope?: any): TimerEvent;
        }

        class TimerEvent {
            remove(): void;
        }
    }

    export namespace Physics {
        namespace Arcade {
            interface ArcadePhysics {
                pause(): void;
            }
        }
    }

    export namespace Cameras {
        namespace Scene2D {
            interface CameraManager {
                main: Camera;
            }

            interface Camera {
                shake(duration: number, intensity: number): void;
            }
        }
    }

    export namespace Tweens {
        interface TweenManager {
            add(config: any): Tween;
        }

        interface Tween {
            stop(): this;
            destroy(): void;
        }
    }
} 