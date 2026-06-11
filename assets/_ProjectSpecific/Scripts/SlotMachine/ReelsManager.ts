import { _decorator, Component, SpriteFrame, JsonAsset, resources, director, Enum, Node } from 'cc';
import { GameEvents } from '../GameEvents';
import { Reel } from './Reel';
import { SymbolConfig } from '../SymbolConfig'; // Import your pure data structure
import { ResultsGenerator, SpinResult } from './ResultsGenerator';
import { eGameSpeedMode } from '../Enums/eGameSpeedMode';
const { ccclass, property } = _decorator;

@ccclass('ReelsManager')
export class ReelsManager extends Component {

    // 1. Create the global static reference pointer
    public static instance: ReelsManager | null = null;

    // #region MANAGER REFERENCES
    // An array holding your 3 Reel components
    @property({ type: [Node] })
    private reelNodes: Node[] = [];

    private reels: Reel[] = [];

    // 1. Reference a PURE JSON asset file (No nodes, no prefabs!)
    @property({ type: JsonAsset, tooltip: "Drag your MainSymbolConfig.json file here" })
    private symbolConfigJson: JsonAsset | null = null;
    // #endregion

    // #region MANAGER SETTINGS
    @property({
        tooltip: "How many step shifts each individual reel will perform before stopping"
    })
    private baseSpinSteps: number = 10;

    @property({
        tooltip: "The staggered delay (in seconds) between each reel stopping"
    })
    private delayBetweenReels: number = 0.5;

    @property({
        type: Enum(eGameSpeedMode), // Wrapped inside the explicit Enum mapping function
        tooltip: "Select the default spinning speed configuration"
    })
    public currentSpeedMode: eGameSpeedMode = eGameSpeedMode.NORMAL;
    // #endregion

    // #region PRIVATE VARIABLES
    private _config: SymbolConfig | null = null;
    private _isSequenceRunning: boolean = false;
    
    // A quick lookup table for pre-loaded images: Key = symbol ID, Value = SpriteFrame
    private _spriteCache: Map<number, SpriteFrame> = new Map();

    // Local cache for every spin result
    private _spinResult: SpinResult | null = null;
    // Getter for _spinResult value
    public get GetSpinResult(): SpinResult | null { return this._spinResult }

    // #endregion

    // #region INITIALIZATION
    protected onLoad() {
        if (ReelsManager.instance === null) {
            ReelsManager.instance = this;
        } else if (ReelsManager.instance !== this) {
            this.node.destroy();
            return;
        }


        this.reels = [];
        for (let i = 0; i < this.reelNodes.length; i++) {
            const nodeItem = this.reelNodes[i];
            if (nodeItem) {
                const component = nodeItem.getComponent(Reel);
                if (component) {
                    this.reels.push(component);
                } else {
                    console.error(`[ReelsManager] Node at index ${i} is missing the Reel script component!`);
                }
            }
        }


        // Subscribe to the global events channel
        director.on(GameEvents.ON_SPIN_CLICKED, this.OnSpinClicked, this);
        director.on(GameEvents.ON_SPIN_CLICKED, this.ResetAllReelAnimations, this);
        director.on(GameEvents.ON_STOP_CLICKED, this.StopAllReels, this);
        director.on(GameEvents.ON_SPEED_CHANGED, this.OnSpeedChanged, this);
        
        // 1. Parse your JSON source of truth exactly ONCE right here
        if (this.symbolConfigJson && this.symbolConfigJson.json) {
            this._config = this.symbolConfigJson.json as SymbolConfig;
            console.log("Symbol Data Config successfully injected!", this._config);

            // 2. Clear out async from onLoad, and handle initialization inside the success callback instead!
            this.PreloadSymbolAssetsAsync().then(() => {
                this.InitializeAllReels();
            });
        }

    }


    protected onDestroy() {

        // ALWAYS unsubscribe when the node dies to prevent memory leaks!
        director.off(GameEvents.ON_SPIN_CLICKED, this.OnSpinClicked, this);
        director.off(GameEvents.ON_SPIN_CLICKED, this.ResetAllReelAnimations, this);
        director.off(GameEvents.ON_STOP_CLICKED, this.StopAllReels, this);
        director.off(GameEvents.ON_SPEED_CHANGED, this.OnSpeedChanged, this);

    }


    // Created a clean helper to handle the loop right when the cache completes
    private InitializeAllReels() {
        // 4. Trigger your reel randomization here safely after cache is 100% full.
        for (let i = 0; i < this.reels.length; i++) {
            if (this.reels[i]) {
                this.reels[i].Initialize();
            }
        }
    }

    private PreloadSymbolAssetsAsync(): Promise<void> {
        if (!this._config || !this._config.symbolList) return Promise.resolve();

        // Map each asset request into a structured Promise contract
        const loadPromises = this._config.symbolList.map(entry => {
            return new Promise<void>((resolve) => {
                const assetPath = `${entry.spritePath}/spriteFrame`;

                resources.load(assetPath, SpriteFrame, (err, frame) => {
                    if (!err && frame) {
                        this._spriteCache.set(entry.id, frame);
                    } else {
                        console.error(`[ReelsManager] Failed to cache asset: ${assetPath}`, err);
                    }
                    resolve(); // Always resolve so we don't lock the entire boot cycle
                });
            });
        });

        // This finishes only when every single item in the loop has run its callback
        return Promise.all(loadPromises).then(() => {
            console.log("[ReelsManager] Cache complete! Total items cached:", this._spriteCache.size);
        });
    }
    // #endregion

    // #region GAME EVENTS RELATED

    private OnSpinClicked(): void {

        this.StartSlotSequence();

    }

    private OnSpeedChanged(newSpeed: eGameSpeedMode): void {

        this.currentSpeedMode = newSpeed;
        console.log(`[ReelsManager] Event Received! Internals updated to: ${eGameSpeedMode[this.currentSpeedMode]}`);

    }

    // #endregion

    /**
     * Orchestrates the cascading spin behavior across all reels
     */
    public async StartSlotSequence(): Promise<void> {


        this._spinResult = ResultsGenerator.instance.GenerateSpinResult();
        console.log(`Total spin sequence payouts generated: Payout Value = ${this._spinResult.totalWin}`);


        this._isSequenceRunning = true;

        // Local variables to hold our final steps for this specific spin execution
        let reel0Steps: number;
        let reel1Steps: number;
        let reel2Steps: number;

        // ==========================================
        // STEP CONFIGURATION MATRIX
        // ==========================================
        if (this.currentSpeedMode != eGameSpeedMode.TURBO) {

            // SPEED MODE VS NORMAL MODE: Calculate the speed step scaler
            // SPEED mode cuts the tracking steps/time duration exactly in half (0.5x)
            const speedMultiplier = (this.currentSpeedMode === eGameSpeedMode.SPEED) ? 0.5 : 1.0;

            // Apply your staggered matrix math scaled down by the multiplier
            reel0Steps = Math.round(this.baseSpinSteps * speedMultiplier);

            reel1Steps = Math.round((this.baseSpinSteps + Math.round(this.delayBetweenReels / 0.2)) * speedMultiplier);

            reel2Steps = Math.round((this.baseSpinSteps + Math.round((this.delayBetweenReels * 2) / 0.2)) * speedMultiplier);

        }

        // ==========================================
        // EXECUTION PASS
        // ==========================================
        // Extract columns from the 3x3 matrix: [Row0, Row1, Row2] for each column
        const reel0Targets = [this._spinResult.matrix[0][0], this._spinResult.matrix[1][0], this._spinResult.matrix[2][0]];
        const reel1Targets = [this._spinResult.matrix[0][1], this._spinResult.matrix[1][1], this._spinResult.matrix[2][1]];
        const reel2Targets = [this._spinResult.matrix[0][2], this._spinResult.matrix[1][2], this._spinResult.matrix[2][2]];

        if (this.currentSpeedMode === eGameSpeedMode.TURBO) {

            // PRODUCE INSTANT RESULTS ON TURBO MODE
            await Promise.all([
                this.reels[0].InstantResult(reel0Targets),
                this.reels[1].InstantResult(reel1Targets),
                this.reels[2].InstantResult(reel2Targets)
            ]);

        }
        else {

            await Promise.all([
                this.reels[0].SpinReel(reel0Steps, reel0Targets),
                this.reels[1].SpinReel(reel1Steps, reel1Targets),
                this.reels[2].SpinReel(reel2Steps, reel2Targets)
            ]);
        }
        


        this._isSequenceRunning = false;
        director.emit(GameEvents.ON_SEQUENCE_STOPPED);

        if (this._spinResult.totalWin != 0) {

            this.AnimateWinningLines(this._spinResult.winningPaylines);

        }

    }


    private StopAllReels(): void {

        this.reels.forEach(reel => {
            reel.StopReel();
        });

    }


    // Returns the exact pre-loaded texture asset along with its ID config
    public GetRandomSymbolSprite(outData: { id: number, frame: SpriteFrame | null }): boolean {
        if (!this._config || this._config.symbolList.length === 0) return false;

        const randomIndex = Math.floor(Math.random() * this._config.symbolList.length);
        const choice = this._config.symbolList[randomIndex];

        outData.id = choice.id;
        outData.frame = this._spriteCache.get(choice.id) || null;

        return outData.frame !== null;
    }


    public GetSpriteFrameById(id: number): SpriteFrame | null {
        return this._spriteCache.get(id) || null;
    }



    /**
     * Loops through the winning paylines and delegates animations down to the Reels
     */
    private AnimateWinningLines(winningPaylines: number[]): void {
        // The exact same 5 coordinate definitions from your ResultsGenerator
        const paylineDefinitions = [
            [[0, 0], [0, 1], [0, 2]], // Line 0: Top Row
            [[1, 0], [1, 1], [1, 2]], // Line 1: Middle Row
            [[2, 0], [2, 1], [2, 2]], // Line 2: Bottom Row
            [[0, 0], [1, 1], [2, 2]], // Line 3: Diagonal Down
            [[2, 0], [1, 1], [0, 2]]  // Line 4: Diagonal Up
        ];

        // Loop through the list of hit lines (e.g., [0, 4])
        winningPaylines.forEach(lineIndex => {
            const coordinateMap = paylineDefinitions[lineIndex];

            // Loop through each of the 3 coordinates inside this winning line
            coordinateMap.forEach(coords => {
                const row = coords[0]; // Vertical position (0, 1, or 2)
                const col = coords[1]; // Horizontal Column/Reel position (0, 1, or 2)

                // 1. Find the correct column Reel component using 'col'
                const targetReel = this.reels[col];

                // 2. Hand off the row index to that Reel
                if (targetReel) {
                    targetReel.AnimateSymbolAtRow(row);
                }
            });
        });
    }


    private ResetAllReelAnimations(): void {
        for (var i = 0; i < this.reels.length; i++) {

            this.reels[i].ResetAllSymbols();

        }
    }

}



    