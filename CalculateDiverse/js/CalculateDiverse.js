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


/**
 * @param {Array} slicedGroups
 * @param {Array} domain
 * 
 * slicedGropups
 * [[{key:[a,x], value:2},{key:[a,y], value:4},{...},...],[{...},{...},...],...]
 * 
 * domain
 * [[a,b],[x,y,z]]
 */

class CalculateDiverse {
    constructor(slicedGroups, domain){
        this._slicedGroups = slicedGroups;
        this._domain = domain;
    };

    initialize(){
        this._results = {};
    };

    inGroups(){
        const calculateDiverseInGroups = new CalculateDiverseInGroups(this._slicedGroups, this._domain);
        calculateDiverseInGroups.main();
        const results = calculateDiverseInGroups.results();
        this._results.each_detail = results.each_detail;
        this._results.each_simple = results.each_simple;
        this._results.ave_detail = results.ave_detail;
        this._results.ave_simple = results.ave_simple;
        this._results.sd_detail = results.sd_detail;
        this._results.sd_simple = results.sd_simple;
    };

    btwGroups(){
        const calculateDiverseBtwGroups = new CalculateDiverseBtwGroups(this._slicedGroups, this._domain);
        calculateDiverseBtwGroups.main();
        const results = calculateDiverseBtwGroups.results();
        this._results.btw_detail = results.btw_detail;
        this._results.btw_simple = results.btw_simple;
    };

    main(){
        this.initialize();
        this.inGroups();
        this.btwGroups();
    };

    results(){
        return this._results;
    };
};



class CalculateDiverseInGroups {
    constructor(slicedGroups, domain){
        this._slicedGroups = slicedGroups;
        this._domain = domain;
    };

    calculate(amounts){
        if(amounts.length < 2){
            return -1;
        };
        let maxPattern = cal.stdev([cal.sum(amounts)].concat([...new Array(amounts.length - 1)].fill(0)));
        if(maxPattern === 0){
            return -1;
        };
        return 1 - cal.stdev(amounts) / maxPattern;
    };

    /**
     * input: [{key:[a,x],value:0},{key:[a,y],value:0},...]
     * comb: {[x]:{a:0,b:0},[y]:{a:0,b:0},[z]:{a:0,b:0},[a]:{x:0,y:0,z:0},[b]:{x:0,y:0,z:0}}
     * output: [{a:0,b:0},{a:0,b:0},{a:0,b:0},{x:0,y:0,z:0},{x:0,y:0,z:0}]
     */
    createConbinations(group){
        const comb = this._domain.reduce((pObj, _, index) => {
            group.forEach((obj) => {
                const keyName = obj.key.reduce((p, c, i) => p + (index === i ? '' : `[${c}]`), '');
                if(!(keyName in pObj)){
                    pObj[keyName] = {};
                };
                pObj[keyName][obj.key[index]] = obj.value;
            });
            return pObj;
        }, {});
        return Object.values(comb);
    };

    /**
     * input: [{a:0,b:0},{a:0,b:0},{a:0,b:0},{x:0,y:0,z:0},{x:0,y:0,z:0}]
     * output: number
     */

    diverseInGroup(objArray){
        const divs = objArray.reduce((pArray, cObj) => {
            const result = this.calculate(Object.values(cObj));
            if(result !== -1){
                pArray.push(result);
            };
            return pArray;
        }, []);
        if(divs.length === 0){
            return -1;
        };
        return cal.round(Math.sqrt(cal.sqSum(divs)/divs.length), 4);
    };

    /**
     * input: [{key:[a,x],value:0},{key:[a,y],value:0},...]
     * output: [{a:4,b:7},{x:3,y:6,z:2}]
     */

    sumMaterial(group){
        return this._domain.map((_, index) => {
            return group.reduce((pObj, cObj) => {
                const key = cObj.key[index];
                if(key === ''){
                    return pObj;
                };
                if(!(key in pObj)){
                    pObj[key] = 0;
                };
                pObj[key] += cObj.value;
                return pObj;
            }, {});
        });
    };

    calculateAverage(amounts){
        return cal.round(cal.average(amounts), 4);
    };

    calculateStdev(eachDiverse){
        if(!Array.isArray(eachDiverse) || eachDiverse.length < 2){
            return -1;
        };
        return cal.round(cal.stdev(eachDiverse), 4);
    };

    main(){
        this._eachInGroup_detail = this._slicedGroups.map((group) => {
            const combGroup = this.createConbinations(group);
            return this.diverseInGroup(combGroup);
        });
        this._averageIngroup_detail = this.calculateAverage(this._eachInGroup_detail);
        this._stdevIngroup_detail = this.calculateStdev(this._eachInGroup_detail);

        this._eachInGroup_simple = this._slicedGroups.map((group) => {
            const sumMaterial = this.sumMaterial(group);
            return this.diverseInGroup(sumMaterial);
        });
        this._averageIngroup_simple = this.calculateAverage(this._eachInGroup_simple);
        this._stdevIngroup_simple = this.calculateStdev(this._eachInGroup_simple);
    };

    results(){
        return {
            each_detail: this._eachInGroup_detail,
            each_simple: this._eachInGroup_simple,
            ave_detail: this._averageIngroup_detail,
            ave_simple: this._averageIngroup_simple,
            sd_detail: this._stdevIngroup_detail,
            sd_simple: this._stdevIngroup_simple
        };
    };
};


class CalculateDiverseBtwGroups {
    constructor(slicedGroups, domain){
        this._slicedGroups = slicedGroups;
        this._domain = domain;
    };

    /**
     * input: [0,0,0,0]
     * output: number
     */

    calculate(amountsRatio){
        if(amountsRatio.length < 2){
            return -1;
        };
        let maxPattern = cal.stdev([cal.sum(amountsRatio)].concat([...new Array(amountsRatio.length - 1)].fill(0)));
        if(maxPattern === 0){
            return -1;
        };
        return cal.stdev(amountsRatio) / maxPattern;
    };

    
    /**
     * input: [{key:[a,x],value:0},{key:[a,y],value:0},...]
     * output: [{key:[a,x],value:0},{key:[a,y],value:0},...]
     */

    createMaterialsRatio(group){
        const sumAll = group.reduce((p, cObj) => p + cObj.value, 0);
        const sumEachDomain = group.reduce((pArray, cObj) => {
            cObj.key.forEach((material, index) => {
                if(material !== ''){
                    pArray[index] += cObj.value;
                };
            });
            return pArray;
        }, Array.from({length: this._domain.length}).fill(0));

        return group.map((obj) => {
            let sumValue = sumAll;
            if(obj.key.includes('')){
                let i = obj.key.reduce((p, c, index) => (c === '' ? p : index), -1);
                sumValue = sumEachDomain[i] ?? sumAll;
            };
            return {
                key: obj.key,
                value: obj.value / sumValue * 100
            };
        });
    };

    /**
     * input: -
     * output: {"a,x":[0,0,0,...],"a,y":[0,0,0,...],...}
     */

    createBtwGroups(){
        const btwGroups = {};
        this._materialsRatio.flat().forEach((obj) => {
            const keyName = obj.key.join(',');
            if(!Array.isArray(btwGroups[keyName])){
                btwGroups[keyName] = [];
            };
            btwGroups[keyName].push(obj.value);
        });
        return btwGroups;
    };

    /**
     * input: [[0,0,0,...],[0,0,0,...],[0,0,0,...]]
     * number
     */

    diverseBtwGroups(arrayInArray){
        const divs = arrayInArray.reduce((pArray, cArray) => {
            const result = this.calculate(cArray);
            if(result !== -1){
                pArray.push(result);
            };
            return pArray;
        }, []);
        if(divs.length === 0){
            return -1;
        };
        return cal.round(Math.sqrt(cal.sqSum(divs)/divs.length), 4);
    };

    /**
     * input: [{key:[a,x],value:0},{key:[a,y],value:0},...]
     * output: {a:0,b:0,x:0,y:0,z:0}
     */

    sumMaterial(group){
        const sumMaterial = this._domain.flat().reduce((pObj, c) => {
            pObj[c] = 0;
            return pObj;
        }, {});
        group.forEach((obj) => {
            obj.key.forEach((key) => {
                sumMaterial[key] += obj.value;
            });
        });
        return sumMaterial;
    };

    /**
     * input: -
     * output: {a:[0,0,0,...],b:[0,0,0,...],...}
     */

    diverseSumMaterial(){
        const allDomain = this._domain.flat();
        const sumMaterials = this._materialsRatio.map(group => this.sumMaterial(group));
        return sumMaterials.reduce((pObj, cObj) => {
            allDomain.forEach((value) => {
                if(!(value in pObj)){
                    pObj[value] = [];
                };
                pObj[value].push(cObj[value]);
            });
            return pObj;
        }, {});
    };

    main(){
        this._materialsRatio = this._slicedGroups.map(group => this.createMaterialsRatio(group));
        const groupArray_detail = Object.values(this.createBtwGroups());
        this._btwGroup_detail = this.diverseBtwGroups(groupArray_detail);
        const groupArray_simple = Object.values(this.diverseSumMaterial());
        this._btwGroup_simple = this.diverseBtwGroups(groupArray_simple);
    };

    results(){
        return {
            btw_detail: this._btwGroup_detail,
            btw_simple: this._btwGroup_simple
        };
    };
};
