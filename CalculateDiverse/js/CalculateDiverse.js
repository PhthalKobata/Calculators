/**
 * @author こばた ふたる
 * twitter: https://twitter.com/Kass_kobataku
 * github: https://github.com/PhthalKobata
 * misskey.io: https://misskey.io/@phKobata
 * note: https://note.com/phta_kobata
 * 
 * @help
 * 著作権は こばた ふたる に帰属しますが、利用や改変は自由です。
 */

'use strict';

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * 数学の関数（平均、四捨五入、分散、標準偏差）
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

const MathFunc = {

    error: (funcName = '', arg, validLength = 0) => {
        const valid = arg.every(value => typeof value === 'number' && !isNaN(value));
        if(!valid){
            throw new TypeError(`not a number included <MathFunc-${funcName}>`);
        };
        if(arg.length < validLength){
            throw new Error(`Number of values is less than ${validLength} <MathFunc-${funcName}>`);
        };
    },

    sum: (...values) => {
        MathFunc.error('sum', values);
        return values.reduce((pValue, cValue) => pValue + cValue, 0);
    },

    sumSq: (...values) => {
        MathFunc.error('sumSq', values);
        return values.reduce((pValue, cValue) => pValue + Math.pow(cValue, 2), 0);
    },

    average: (...values) => {
        MathFunc.error('average', values, 1);
        return MathFunc.sum(...values) / values.length;
    },

    round: (value, f = 0) => {
        MathFunc.error('round', [value, f]);
        return Math.round(value * Math.pow(10, f)) / Math.pow(10, f);
    },

    variance_p: (...values) => {
        MathFunc.error('variance_p', values, 1);
        const average = MathFunc.average(...values);
        return values.reduce((pValue, cValue) => pValue + Math.pow(cValue - average, 2), 0) / values.length;
    },

    stdev_p: (...values) => {
        MathFunc.error('stdev_p', values, 1);
        return Math.sqrt(MathFunc.variance_p(...values));    
    },

    variance_s: (...values) => {
        MathFunc.error('variance_s', values, 2);
        const average = MathFunc.average(...values);
        return values.reduce((pValue, cValue) => pValue + Math.pow(cValue - average, 2), 0) / (values.length - 1);
    },

    stdev_s: (...values) => {
        MathFunc.error('stdev_s', values, 2);
        return Math.sqrt(MathFunc.variance_s(...values));    
    },

    rms: (...values) => {
        MathFunc.error('rms', values, 1);
        return Math.sqrt(MathFunc.sumSq(...values) / values.length);
    }
};


/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 多様性の計算
 * @param {Array.<Array.<{key:string, value:number}>>} slicedGroups
 * [[{key:"a,x", value:2},{key:"a,y", value:4},{...},...],[{...},{...},...],...]
 * keyは要素のもつ性質、valueはその要素の集団内の数、内部の配列は集団、外側の配列は群集を表す
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

class CalculateDiverse {
    constructor(slicedGroups){
        this._slicedGroups = slicedGroups;
        this._results = {};
    };

    /**
     * 集団内の多様性の計算
     */
    inGroups(){
        const calculateDiverseInGroups = new CalculateDiverseInGroups(this._slicedGroups);
        calculateDiverseInGroups.main();
        const results = calculateDiverseInGroups.results();
        this._results.each_in = results.each;
        this._results.ave_in = results.ave;
        this._results.sd_in = results.sd;
        this._results.synthesis_in = results.synthesis;
    };

    /**
     * 集団間の多様性の計算
     */
    btwGroups(){
        const calculateDiverseBtwGroups = new CalculateDiverseBtwGroups(this._slicedGroups);
        calculateDiverseBtwGroups.main();
        const results = calculateDiverseBtwGroups.results();
        this._results.each_btw = results.each;
        this._results.ave_btw = results.ave;
        this._results.sd_btw = results.sd;
        this._results.synthesis_btw = results.synthesis;
    };

    /**
     * 複素多様性の絶対値
     */
    absolute(){
        if(this._results.synthesis_in === -1 || this._results.synthesis_btw === -1){
            this._results.absolute = -1;
        }
        else{
            const absolute = Math.sqrt(MathFunc.sumSq(this._results.synthesis_in, this._results.synthesis_btw));
            this._results.absolute = MathFunc.round(absolute, 4);    
        };
    };

    /**
     * 複素多様性の偏角
     */
    angle(){
        const angle = Math.atan2(this._results.synthesis_in, this._results.synthesis_btw);
        if(this._results.synthesis_in === -1 || this._results.synthesis_btw === -1){
            this._results.angle = -1;
        }
        else{
            this._results.angle = MathFunc.round(angle / Math.PI * 180, 4);
        };
    };

    /**
     * メインメソッド
     */
    main(){
        this.inGroups();
        this.btwGroups();
        this.absolute();
        this.angle();
    };

    /**
     * アクセサ this._result
     * @returns {Object}
     */
    results(){
        return this._results;
    };
};

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 集団内の多様性の計算
 * @param {Array.<Array.<{key:string, value:number}>>} slicedGroups
 * [[{key:"a,x", value:2},{key:"a,y", value:4},{...},...],[{...},{...},...],...]
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

class CalculateDiverseInGroups {
    constructor(slicedGroups){
        this._slicedGroups = slicedGroups;
        this._results = {};
    };

    /**
     * 数値の計算
     * @param {Array.<number>} amounts 計算に使用する数値
     * @returns {number} 計算結果
     */
    calculate(amounts){
        if(amounts.length < 2){
            return -1;
        };
        let maxPattern = MathFunc.stdev_p(...[MathFunc.sum(...amounts)].concat([...new Array(amounts.length - 1)].fill(0)));
        if(maxPattern === 0){
            return -1;
        };
        return 1 - MathFunc.stdev_p(...amounts) / maxPattern;
    };

    /**
     * 群集に対する集団内の要素多様性
     * @param {Array.<number>} validValues 
     * @returns {number} 計算結果
     */
    synthesis(validValues){
        if(validValues.lenbgth < 1){
            return -1;
        };
        const values = validValues.map(value => 1 - value);
        return 1 - MathFunc.rms(...values);
    };

    /**
     * メインメソッド
     */
    main(){
        this._eachInGroup = this._slicedGroups.map((group) => {
            const amounts = group.map(obj => obj.value);
            return MathFunc.round(this.calculate(amounts), 4);
        });
        const validValues = this._eachInGroup.filter(value => value >= 0);
        this._results.ave = validValues.length < 1 ? -1 : MathFunc.round(MathFunc.average(...validValues), 4);
        this._results.sd = validValues.length < 2 ? -1 : MathFunc.round(MathFunc.stdev_p(...validValues), 4);
        this._results.synthesis = validValues.length < 1 ? -1 : MathFunc.round(this.synthesis(validValues), 4);
        this._results.each = this._eachInGroup.map(value => MathFunc.round(value, 4));
    };

    /**
     * アクセサ
     * @returns {Object}
     */
    results(){
        return this._results;
    };
};



/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 集団間の多様性の計算
 * @param {Array.<Array.<{key:string, value:number}>>} slicedGroups
 * [[{key:"a,x", value:2},{key:"a,y", value:4},{...},...],[{...},{...},...],...]
 * ----------------------------------------------------------------------------------------------------------------------------------------
*/

class CalculateDiverseBtwGroups {
    constructor(slicedGroups){
        this._slicedGroups = slicedGroups;
        this._domain = slicedGroups[0].map((obj) => obj.key);
        this._results = {};
    };

    /**
     * 数値の計算
     * @param {Array.<number>} amounts 計算に使用する数値
     * @returns {Number} 計算結果
     */
    calculate(amountsRatio){
        if(amountsRatio.length < 2){
            return -1;
        };
        let maxPattern = MathFunc.stdev_p(...[MathFunc.sum(...amountsRatio)].concat([...new Array(amountsRatio.length - 1)].fill(0)));
        if(maxPattern === 0){
            return -1;
        };
        return MathFunc.stdev_p(...amountsRatio) / maxPattern;
    };

    /**
     * 値を比率（百分率）に変換
     * @param {Array.<{key:string, value:number}>} group 
     * @returns {Array.<{key:string, value:number}>}
     * input: [{key:"a,x",value:0},{key:"a,y",value:0},...]
     * output: [{key:"a,x",value:0},{key:"a,y",value:0},...]
     */
    createMaterialsRatio(group){
        const sumAll = group.reduce((p, cObj) => p + cObj.value, 0);
        return group.map((obj) => {
            let sumValue = sumAll;
            return {
                key: obj.key,
                value: obj.value / sumValue * 100
            };
        });
    };

    /**
     * 要素比率のまとめかたを「集団ごと」から「要素ごと」に変換
     * [{key:"a,x",value:0},{key:"a,y",value:0},...]を
     * {"a,x":[0,0,0,...], "a,y":[0,0,0,...]}に変換
     * @returns {Object.<Array>}
     */
    createGroupsEachMaterial(){
        const groupEachMaterials = this._domain.reduce((pObj, c) => {
            pObj[c] = [];
            return pObj;
        }, {});

        this._materialsRatio.forEach((arr) => {
            arr.forEach((obj) => {
                groupEachMaterials[obj.key].push(obj.value);
            });
        });

        return groupEachMaterials;
    };

    /**
     * メインメソッド
     */
    main(){
        this._materialsRatio = this._slicedGroups.map(group => this.createMaterialsRatio(group));
        this._groupEachMaterials = this.createGroupsEachMaterial();
        this._diverseEachMaterials = Object.values(this._groupEachMaterials).map(group => this.calculate(group));
        const validValues = this._diverseEachMaterials.filter(value => value >= 0);
        this._results.synthesis = validValues.length < 1 ? -1 : MathFunc.round(MathFunc.rms(...validValues), 4);
        this._results.ave =  validValues.length < 1 ? -1 : MathFunc.round(MathFunc.average(...validValues), 4);
        this._results.sd = validValues.length < 2 ? -1 : MathFunc.round(MathFunc.stdev_p(...validValues), 4);
        this._results.each = this._diverseEachMaterials.map(value => MathFunc.round(value, 4));
    };

    /**
     * アクセサ
     * @returns {Object}
     */
    results(){
        return this._results;
    };
};

