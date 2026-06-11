import { _decorator, Component, Sprite, SpriteFrame, tween, Tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {

    @property
    public id: number = 0;

    @property(Sprite)
    private spriteImage: Sprite | null = null;


    private _tween: Tween | null = null;


    public SetData(id: number, spriteFrame : SpriteFrame) {

        this.id = id;

        if (this.spriteImage) {
            this.spriteImage.spriteFrame = spriteFrame;
        }

    }

    public PlayWinAnimation(duration: number = 0.2): void {
        // 1. Clear previous instances locally
        this._tween?.stop();

        // 2. Explicitly reset the scale to baseline before building the new tween
        this.node.setScale(1, 1, 1);

        const originalScale = v3(1, 1, 1);
        const scaleUpTarget = v3(1.3, 1.3, 1);
        const scaleDownTarget = v3(0.95, 0.95, 1);

        // 3. Move it to the front layer
        this.node.setSiblingIndex(this.node.parent!.children.length - 1);

        // 4. Run a clean, standard 2-sequence loop
        this._tween = tween(this.node)
            .to(duration, { scale: scaleUpTarget }, { easing: 'quadOut' })
            .to(duration, { scale: scaleDownTarget }, { easing: 'quadIn' })
            .to(duration * 0.5, { scale: originalScale }, { easing: 'quadOut' })
            .union()
            .repeat(5)
            .start();
    }


    public ResetAnimation(): void {
        // Stop the local tween track
        this._tween?.stop();
        this.node.setScale(1, 1, 1);
    }

}