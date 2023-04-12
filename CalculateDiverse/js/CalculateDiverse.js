'use strict';


const Common = function(){
    throw new Error('this is static class');
};

Common.isNumber = function(value){
    let type = typeof value;
    if(type === 'number'){
        return !isNaN(value) && isFinite(value);
    }
    else{
        return type === 'string' && !isNaN(value - 0);
    };
};

Common.isObject = function(obj){
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
};

Common.isNatural = function(value){
    return Common.isNumber(value) && Math.floor(value) === Math.floor(value * 10) / 10;
};

Common.toHalfWidth = function(str){
    return str.replace(/[\uff01-\uff5e]/g, function(ch) {
        // 文字の Unicode コードポイントを取得する
        var code = ch.charCodeAt(0);
        // Unicode コードポイントから半角文字を生成する
        return String.fromCharCode(code - 0xfee0);
      });
};

Common.rebuildNumber = function(value){
    let num = Common.toHalfWidth(value).replace(/[^0-9]/g, '');
    return Number(num);
};


/**
 * 数学の関数（平均、四捨五入、分散、標準偏差）
 * @param {NumbersArray} arr 
 * @returns 
 */

class Cal {
    constructor(){};

    sum(arr){
        return arr.reduce((pValue, cValue) => pValue + cValue, 0);
    };

    sqSum(arr){
        return arr.reduce((pValue, cValue) => pValue + Math.pow(cValue, 2), 0);
    };

    average(arr){
        const n = arr.length;
        if(!Array.isArray(arr) || n === 0){
            throw new Error('argument array is invalid');
        };
        return this.sum(arr) / n;
    };

    round(value, f = 0){
        return Math.round(value * Math.pow(10, f)) / Math.pow(10, f);
    };

    variance(arr){
        const n = arr.length;
        if(!Array.isArray(arr) || n < 2){
            throw new Error('argument array is invalid');
        };
        const average =this.average(arr);
        return arr.reduce((pValue, cValue) => pValue + Math.pow(cValue - average, 2), 0) / (n - 1);
    };

    stdev(arr){
        const variance = this.variance(arr);
        return Math.sqrt(variance);    
    };
};

const cal = new Cal();



//----------------------------------------------------------------------------------------
//すでに集団に分割された系の多様性の計算
//集団に分割され、それぞれの集団に属する系の要素の種類と数が決まっている

/**
 * 
 * @param {Array} slicedGroup 
 * @param {Array} domain 
 */

class CalculateDiverse {

    constructor(slicedGroup, domain = null){
        this._slicedGroup = slicedGroup;
        this._domain = domain;
    };

    //定義域をKeyにもつ任意の値の連想配列
    createDefaultObject(value){
        const defaultObj = {};
        this._domain.forEach((key) => {
            defaultObj[key] = value;
        });
        return defaultObj;
    };

    calculateEachDiverse(){
        this._eachDiverse = this._slicedGroup.map((obj) => {
            let values = Object.values(obj);
            let sum = cal.sum(values);
            let result = 1 - cal.stdev(values) / cal.stdev([sum].concat([...new Array(values.length - 1)].fill(0)));
            return cal.round(result, 4);
        });
    };

    calculateAverageDiverse(){
        this._averageDiverse = cal.round(cal.average(this._eachDiverse), 4);
    };

    calculateDiverseBtwGroups(){
        let normalizedGroup = this._slicedGroup.reduce((pObj, cObj) => {
            let sum = cal.sum(Object.values(cObj));
            Object.keys(pObj).forEach((key) => {
                if(pObj[key] === null){
                    pObj[key] = [];
                };
                pObj[key].push(cObj[key] * 100 / sum);
            });
            return pObj;
        }, this.createDefaultObject(null));
        let varianceBtwGroups = Object.values(normalizedGroup).reduce((pValue, cArray) => pValue + cal.variance(cArray), 0) / this._domain.length;
        this._diverseBtwGroups = Math.sqrt(this.normalizeBtwGroup(varianceBtwGroups));
    };

    normalizeBtwGroup(variance){
        let slicedLength = this._slicedGroup.length;
        let maxPettern = [].concat([...new Array(Math.ceil(slicedLength / 2))].fill(100), [...new Array(Math.floor(slicedLength / 2))].fill(0));
        return cal.round(variance / cal.variance(maxPettern), 4);
    };

    main(){
        this.calculateEachDiverse();
        this.calculateAverageDiverse();
        if(this._slicedGroup.length > 1){
            this.calculateDiverseBtwGroups();
        }
        else{
            this._diverseBtwGroups = -1;
        };
    };

    slicedGroup(){
        return this._slicedGroup;
    };

    eachDiverse(){
        return this._eachDiverse;
    };

    averageDiverse(){
        return this._averageDiverse;
    };

    diverseBtwGroups(){
        return this._diverseBtwGroups;
    };
};


//----------------------------------------------------------------------------------------
//直積集合の場合
//domain [[v,w],[x, y],...]
/**
 * 
 * @param {Array} slicedGroup 
 * @param {Array} domain 
 */


class CalculateDiverseOfProduct {

    constructor(slicedGroup, domain){
        this.initialize.call(this, slicedGroup, domain);
    };

    initialize(slicedGroup, domain){
        this.argumentError(slicedGroup, domain);
        this._slicedGroup = slicedGroup;
        this._domain = domain;
    };

    argumentError(slicedGroup, domain){
        if(!Array.isArray(slicedGroup)){
            throw new Error('argument1 is not array');
        };
        if(!Array.isArray(domain) && domain !== null){
            throw new Error('argument2 is not array');
        };
        if(!domain.every(arr => Array.isArray(arr))){
            throw new Error('parts of argument2 includes not array');
        };
    };

    calculateEachDomains(){
        this._diverseEachDomains = this._domain.map((value) => {
            const obj = {};
            const calculateDiverse = new CalculateDiverse(JSON.parse(JSON.stringify(this._slicedGroup)), value);
            calculateDiverse.main();
            obj.eachDiverse = calculateDiverse.eachDiverse();
            obj.averageDiverse = calculateDiverse.averageDiverse();
            obj.diverseBtwGroups = calculateDiverse.diverseBtwGroups();
            return obj;
        });
    };

    calculateDiverseBtwGroups(){
        let sqsum = this._diverseEachDomains.reduce((pValue, cObj) => {
            return pValue + Math.pow(cObj.diverseBtwGroups, 2);
        }, 0);
        this._diverseBtwGroups = cal.round(Math.sqrt(sqsum / this._domain.length), 4);
    };

    calculateEachDiverse(){
        let length = this._domain.length;
        this._eachDiverse = this._diverseEachDomains.reduce((pArray, cObj) => {
            return pArray.map((value, index) => {
                return value + Math.pow(cObj.eachDiverse[index], 2);
            });
        }, [...new Array(this._slicedGroup.length)].fill(0)).map((value) => {
            return cal.round(Math.sqrt(value / length), 4);
        });
    };

    calculateAverageDiverse(){
        this._averageDiverse = cal.round(cal.average(this._eachDiverse), 4);
    }

    main(){
        this.calculateEachDomains();
        this.calculateEachDiverse();
        this.calculateAverageDiverse();
        if(this._slicedGroup.length > 1){
            this.calculateDiverseBtwGroups();
        }
        else{
            this._diverseBtwGroups = -1;
        };
    };

    eachDiverse(){
        return this._eachDiverse;
    };

    averageDiverse(){
        return this._averageDiverse;
    };

    diverseBtwGroups(){
        return this._diverseBtwGroups;
    };
};

