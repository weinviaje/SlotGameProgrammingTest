import { _decorator, Component, JsonAsset } from 'cc';
const { ccclass, property } = _decorator;

// Structuring our data configuration layout
interface SymbolData {
    id: number;
    name: string;
    payout3x: number; // Payout value if 3 matching symbols land on a payline
    weight: number;   // Higher weight = more common; Lower weight = rare/jackpot
}

@ccclass('ResultsGenerator')
export class ResultsGenerator extends Component {
    public static instance: ResultsGenerator | null = null;

    @property(JsonAsset)
    private symbolConfigJson: JsonAsset | null = null;

    private _symbolsList: SymbolData[] = [];
    private _totalWeight: number = 0;

    protected onLoad() {
        ResultsGenerator.instance = this;
        this.LoadConfiguration();
    }

    private LoadConfiguration() {
        if (!this.symbolConfigJson || !this.symbolConfigJson.json) {
            console.error("[ResultsGenerator] Missing or invalid MainSymbolConfig JSON asset!");
            return;
        }

        // Parse your custom JSON structural array configuration
        this._symbolsList = this.symbolConfigJson.json.symbolList as SymbolData[];

        // Calculate the total combined weight for accurate drop-rate generation
        this._totalWeight = this._symbolsList.reduce((sum, sym) => sum + sym.weight, 0);
        console.log(`[ResultsGenerator] Config loaded. Total combined symbol generation weight: ${this._totalWeight}`);
    }

    /**
     * Call this from ReelsManager to execute a new spin algorithm configuration pass
     */
    public GenerateSpinResult(): { matrix: number[][], totalWin: number, winningPaylines: number[] } {
        // 1. Generate a clean 3x3 matrix populated with random Symbol IDs based on weights
        const matrix: number[][] = [
            [0, 0, 0], // Row 0 (Top Row)
            [0, 0, 0], // Row 1 (Middle Row)
            [0, 0, 0]  // Row 2 (Bottom Row)
        ];

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                matrix[row][col] = this.GetRandomSymbolIdByWeight();
            }
        }

        console.log(
            "[ResultsGenerator] Generated Matrix Layout:\n" +
            matrix.map(row => `[${row.join(', ')}]`).join('\n')
        );

        // 2. Evaluate the matrix against the payline structural coordinates
        const evaluation = this.CheckPaylines(matrix);

        return {
            matrix: matrix,
            totalWin: evaluation.totalWin,
            winningPaylines: evaluation.linesHit
        };
    }

    /**
     * Standard cumulative weight selection algorithm (Weighted Random Distribution)
     */
    private GetRandomSymbolIdByWeight(): number {
        let rand = Math.random() * this._totalWeight;

        for (const symbol of this._symbolsList) {
            if (rand < symbol.weight) {
                return symbol.id;
            }
            rand -= symbol.weight;
        }

        return this._symbolsList[0].id; // Fallback safety catch
    }

    /**
     * Checks the 5 classic paylines for 3-of-a-kind matches
     */
    private CheckPaylines(matrix: number[][]): { totalWin: number, linesHit: number[] } {
        let totalWin = 0;
        const linesHit: number[] = [];

        // Definition of the 5 coordinate maps: [Row, Col] for Reel 0, Reel 1, Reel 2
        const paylineDefinitions = [
            [[0, 0], [0, 1], [0, 2]], // Line 0: Top Row
            [[1, 0], [1, 1], [1, 2]], // Line 1: Middle Row
            [[2, 0], [2, 1], [2, 2]], // Line 2: Bottom Row
            [[0, 0], [1, 1], [2, 2]], // Line 3: Diagonal Down (Top-Left -> Center -> Bottom-Right)
            [[2, 0], [1, 1], [0, 2]]  // Line 4: Diagonal Up (Bottom-Left -> Center -> Top-Right)
        ];

        // Evaluate each payline sequentially
        for (let lineIndex = 0; lineIndex < paylineDefinitions.length; lineIndex++) {
            const coords = paylineDefinitions[lineIndex];

            const symId0 = matrix[coords[0][0]][coords[0][1]];
            const symId1 = matrix[coords[1][0]][coords[1][1]];
            const symId2 = matrix[coords[2][0]][coords[2][1]];

            // Check if all three matching positions along the line hold the same symbol identity
            if (symId0 === symId1 && symId1 === symId2) {
                const winningSymbol = this._symbolsList.find(s => s.id === symId0);
                if (winningSymbol) {
                    totalWin += winningSymbol.payout3x;
                    linesHit.push(lineIndex); // Track which line identity index scored
                    console.log(`🔥 PAYLINE WIN! Line ${lineIndex} matched 3x [${winningSymbol.name}]. Added Payout: ${winningSymbol.payout3x}`);
                }
            }
        }

        return { totalWin, linesHit };
    }
}