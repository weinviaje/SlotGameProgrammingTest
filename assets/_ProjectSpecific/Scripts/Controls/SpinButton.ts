import { _decorator, Component, Button, director, Node, tween } from 'cc';
import { GameEvents } from '../GameEvents';
const { ccclass, property } = _decorator;

@ccclass('SpinButton')
export class SpinButton extends Component {


    // #region REFERENCES

    @property(Node)
    private spinIcon: Node | null = null;

    @property(Node)
    private arrowsIcon: Node | null = null;

    @property(Node)
    private stopIcon: Node | null = null;

    // #endregion


    private _buttonComponent: Button | null = null;

    private _isStopMode: boolean = false;


    start() {

        this._buttonComponent = this.getComponent(Button);

        if (this._buttonComponent) {

            this.node.on(Button.EventType.CLICK, this.OnClick, this);

        }

        director.on('on_sequence_stopped', this.EnableButton, this);

        this.AnimateArrowsIcon();

    }

    protected onDestroy() {

        director.off('on_sequence_stopped', this.EnableButton, this);

    }

    private OnClick() {

        if (this._isStopMode) {

            // Disable button to avoid spamming. Resume after sequence is done. (Check ReelsManager.ts)
            this.DisableButton();

            // Invoke stop event
            director.emit(GameEvents.ON_STOP_CLICKED);

            this._isStopMode = false;
            this.UpdateIcon();
            return;

        }

        director.emit(GameEvents.ON_SPIN_CLICKED);

        this._isStopMode = true;
        this.UpdateIcon();

    }

    // ==========================================
    // HELPER UTILITIES FOR GAME FLOW
    // ==========================================
    private DisableButton() {
        if (this._buttonComponent) {
            this._buttonComponent.interactable = false; // Makes it unclickable and greys it out automatically
        }
    }

    private EnableButton() {
        if (this._buttonComponent) {
            this._buttonComponent.interactable = true; // Restores full interaction

            this._isStopMode = false;
            this.UpdateIcon();

        }
    }

    private UpdateIcon() {

        // Updates button icon
        this.spinIcon.active = !this._isStopMode;
        this.stopIcon.active = this._isStopMode;

    }


    private AnimateArrowsIcon() {

        // Cocos Creator uses standard mathematical rotation:
        // Positive (+) angles = Counter-Clockwise
        // Negative (-) angles = Clockwise

        tween(this.arrowsIcon)
            .by(6 , { angle: -360 }) // Rotate BY -360 degrees over 2 seconds
            .repeatForever()        // Loop this action infinitely
            .start();               // Execute the tween engine chain

    }

}

