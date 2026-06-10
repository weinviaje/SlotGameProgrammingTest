import { _decorator, Component, Button, Sprite, SpriteFrame, director } from 'cc';
import { GameEvents } from '../GameEvents';
import { eGameSpeedMode } from '../Enums/eGameSpeedMode';
const { ccclass, property } = _decorator;

@ccclass('TurboButton')
export class TurboButton extends Component {

    private _buttonComponent: Button | null = null;

    // #region REFERENCES
    @property(Sprite)
    private spriteImage: Sprite | null = null;

    @property({ type: [SpriteFrame] })
    private turboSprites: SpriteFrame[] = [];
    // #endregion

    private _localSpeedMode: eGameSpeedMode = eGameSpeedMode.NORMAL;


    protected start(){

        this._buttonComponent = this.getComponent(Button);
        if (this._buttonComponent) this.node.on(Button.EventType.CLICK, this.OnClick, this);

        this.UpdateIcon();

    }



    private OnClick(): void {

        // 1. Cycle local state
        this._localSpeedMode = (this._localSpeedMode + 1) % 3;

        // 2. Fire the global event and pass the new speed mode as a payload!
        director.emit(GameEvents.ON_SPEED_CHANGED, this._localSpeedMode);

        this.UpdateIcon();

    }



    private UpdateIcon(): void {

        if (this.spriteImage && this.turboSprites[this._localSpeedMode]) {
            this.spriteImage.spriteFrame = this.turboSprites[this._localSpeedMode];
        }

    }


}

