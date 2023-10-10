'use strict'

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 結果の表示
 * @param {Object} params
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class CreateResult {
    constructor(params){
        this._params       = params;
        this._groupCount   = params.groupCount;
        this._domain       = params.domain;
        this._loopCount    = params.loopCount;
        this._optionsValue = params.options;
        this._materials    = params.materials;
        this.initialize();
    };

    /**
     * 初期化
     */
    initialize(){
        const collection = document.getElementsByClassName('showData');
        this._keys = Array.from(collection, node => node.id.replace(/^result-/, ''));
        this._results = this._keys.reduce((pObj, c) => {
            pObj[c] = [];
            return pObj;
        }, {});
    };

    /**
     * slicedGroupsを作成
     */
    createSlicedGroups(){
        const createSlicedGroups = new CreateSlicedGroups(this._params);
        createSlicedGroups.main();
        this._slicedGroups = createSlicedGroups.slicedGroups();
        this._errorNumber = createSlicedGroups.errorNumber();
    };

    /**
     * 多様性を計算
     * @param {Array.<{key:string, value:number}>} slicedGroup 
     */
    calculateDiverse(slicedGroup){
        const deleteEmptyGroup = this.deleteEmptyGroup(slicedGroup);
        const calculateDiverse = new CalculateDiverse(deleteEmptyGroup);
        calculateDiverse.main();
        const _results = calculateDiverse.results();
        _results.slicedGroups = deleteEmptyGroup;
        this._keys.forEach((key) => {
            this._results[key].push(_results[key]);
        });
    };

    /**
     * 空の集団を削除
     * @param {Array.<{key:string, value:number}>} slicedGroup 
     * @returns {Array.<{key:string, value:number}>}
     */
    deleteEmptyGroup(slicedGroup){
        return slicedGroup.filter((grArr) => {
            return grArr.reduce((p, cObj) => p + cObj.value, 0) !== 0;
        });
    }

    /**
     * ループ回数分計算
     */
    calculate(){
        this._slicedGroups.forEach((slicedGroup) => {
            this.calculateDiverse(slicedGroup);
        });
    };

    /**
     * slicedGroupの[{key:x, value:1},{key:y, value:2}]を{x:1, y:2}に変える
     * @param {Array.<{key:string, value:number}>} slicedGroup 
     * @returns {string}
     */
    convertToSlicedGroupString(slicedGroup){
        const obj = slicedGroup.map((arr) => {
            return arr.reduce((pObj, cObj) => {
                let keyName = JSON.stringify(cObj.key).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
                pObj[keyName] = cObj.value;
                return pObj;
            }, {});
        })
        return JSON.stringify(obj).replace(/^\[|\]$|"/g, '');
    };

    /**
     * 計算結果を文字列に変換
     */
    convertResultsStr(){
        this._resultsStr = JSON.parse(JSON.stringify(this._results));
        this._resultsStr.each_btw = this._results.each_btw.map(arr => JSON.stringify(arr).replace(/"/g, ''));
        this._resultsStr.each_in = this._results.each_in.map(arr => JSON.stringify(arr).replace(/"/g, ''));
        this._resultsStr.slicedGroups = this._results.slicedGroups.map(value => this.convertToSlicedGroupString(value));
    };

    /**
     * 結果を表示
     */
    showResults(){
        this._keys.forEach((keyName) => {
            document.getElementById(`result-${keyName}`).innerHTML = this._resultsStr[keyName].slice(0,100).join('<br>');
        });
    };

    /**
     * 結果を削除
     */
    deleteResults(){
        this._keys.forEach((keyName) => {
            document.getElementById(`result-${keyName}`).innerHTML = '';
        });
    };

    /**
     * メインメソッド
     */
    main(){
        this.initialize();
        this.createSlicedGroups();
        switch(this._errorNumber){
            case 0: {
                this.calculate();
                this.convertResultsStr();
                this.showResults();
                break;
            }
            case 1:{
                window.alert('全ての要素数が0個です');
                break;
            }
            case 2:{
                window.alert('全要素数と集団に含まれる要素数を同じにしてください');
                break;
            }
        };
    };

    /**
     * アクセサ
     * @returns {{value:Object, str:string}}
     */
    result(){
        return {
            value: this._results,
            str: this._resultsStr
        };
    };

    /**
     * アクセサ this._param
     * @returns {Object}
     */
    params(){
        return this._params;
    };
};


/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 計算するための配列を作成するクラス
 * @param {Object} params
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class CreateSlicedGroups {
    constructor(params){
        this._groupCount   = params.groupCount;
        this._domain       = params.domains;
        this._loopCount    = params.loopCount;
        this._optionsValue = params.options;
        this._materials    = params.materials;
        this._tableProp    = params.tableProp;
        this._slicedGroups = [];
        this._errorNumber  = 0;
    };

    /**
     * テーブルから要素数の数値を取得する
     */
    getMaterialsAmounts(){
        this._materialAmounts = this._materials.map((value, index) => {
            let v = document.getElementById(`randomMatrix_material-r${index + 1}c1`).value;
            return {
                key: value, 
                value: Number(v || 0)
            };
        });
    };

    /**
     * テーブルから集団に含まれる要素栖の数値を取得する
     */
    getGroupAmounts(){
        this._groupAmounts = Array.from({length:this._tableProp.randomMatrix_group.row - 1}, (_, index) => {
            let v = document.getElementById(`randomMatrix_group-r${index + 1}c1`).value;
            return {
                key: `group${index + 1}`,
                value: Number(v || 0)
            };
        });
    };

    /**
     * 要素数の合計と集団に含まれる個数の合計が同じかどうかを判定
     */
    errorCheck_fixedMatrix(){
        const total = document.getElementById('total-fixedMatrix').textContent;
        if(Number(total) === 0){
            this._errorNumber = 1;
        };
    };

    /**
     * 要素数の合計と集団に含まれる個数の合計が同じかどうかを判定
     */
    errorCheck_randomMatrix_fixedRatio(){
        const total_material = document.getElementById('totalColumns-randomMatrix_material-c1').textContent;
        const total_group = document.getElementById('totalColumns-randomMatrix_group-c1').textContent;        
        if(Number(total_material) === 0){
            this._errorNumber = 1;
        };
        if(Number(total_material) !== Number(total_group)){
            this._errorNumber = 2;
        };
    };

    /**
     * 要素数の合計と集団に含まれる個数の合計が同じかどうかを判定
     */
    errorCheck_randomMatrix_randomRatio(){
        const total_material = document.getElementById('totalColumns-randomMatrix_material-c1').textContent;
        if(Number(total_material) === 0){
            this._errorNumber = 1;
        };
    };

    /**
     * 集団の要素数がランダムのときに集団の要素数を決定する
     */
    createGroupAmounts(){
        const maxValue = this._materialAmounts.reduce((p, cObj) => p + cObj.value, 0);
        const randomInt = [0, maxValue].concat(Array.from({length:this._groupCount - 1}, () => {
            return Math.floor(Math.random() * maxValue);
        })).sort((a, b) => a - b);
        this._groupAmounts = [];
        for(let i = 1; i < randomInt.length; i++){
            this._groupAmounts.push({key:`group${i}`, value:(randomInt[i] - randomInt[i - 1])});
        };
    };

    /**
     * slicedGroup:[[[{key:[a,x], value:2},{...},...],[{...},{...},...],...],[...],...]を作成
     * 集団の内訳の配列：[{key:[a,x], value:2},{...},...]
     * 群集の内訳の配列　：[[集団1の内訳],[集団2の内訳],...]
    */
    slicedGroupsFromFixedMatrix(){
        let group = null;
        let _slicedGroup = [];
        for(let r = 1; r < this._tableProp.fixedMatrix.row; r++){
            group = this._materials.map((keys, index) => {
                let v = document.getElementById(`fixedMatrix-r${r}c${index + 1}`).value;
                return {
                    key: keys.join(','),
                    value: Number(v || 0)
                };
            });
            _slicedGroup.push(group);
        };
        this._slicedGroups = [_slicedGroup];
    };

    /**
     * slicedGroup:[[[{key:[a,x], value:2},{...},...],[{...},{...},...],...],[...],...]を作成
     * 集団の内訳の配列：[{key:[a,x], value:2},{...},...]
     * 群集の内訳の配列　：[[集団1の内訳],[集団2の内訳],...]
    */
    slicedGroupsFromRandomMatrix_fixedRatio(){
        this.getMaterialsAmounts();
        this.getGroupAmounts();
        for(let i = 0; i < this._loopCount; i++){
            this.calculateSlicedGroup();        
        };    
    };

    /**
     * slicedGroup:[[[{key:[a,x], value:2},{...},...],[{...},{...},...],...],[...],...]を作成
     * 集団の内訳の配列：[{key:[a,x], value:2},{...},...]
     * 群集の内訳の配列　：[[集団1の内訳],[集団2の内訳],...]
    */
    slicedGroupsFromRandomMatrix_ramdomRatio(){
        this.getMaterialsAmounts();
        for(let i = 0; i < this._loopCount; i++){
            this.createGroupAmounts();
            this.calculateSlicedGroup();        
        };    
    };
    /**
     * 要素を集団にランダムに振り分ける
     */
    calculateSlicedGroup(){
        const randomlyAssignToGroups = new RandomlyAssignToGroups(this._materialAmounts, this._groupAmounts);
        randomlyAssignToGroups.main();
        this._slicedGroups.push(randomlyAssignToGroups.slicedGroup());
    };

    /**
     * メインメソッド
     */
    main(){
        if(this._optionsValue.importValue === 'fixed'){
            this.errorCheck_fixedMatrix();
            if(this._errorNumber === 0){
                this.slicedGroupsFromFixedMatrix();
            };
        };
        if(this._optionsValue.importValue === 'random'){
            if(this._optionsValue.importRatio === 'fixed'){
                this.errorCheck_randomMatrix_fixedRatio();
                if(this._errorNumber === 0){
                    this.slicedGroupsFromRandomMatrix_fixedRatio();
                };
            };
            if(this._optionsValue.importRatio === 'random'){
                this.errorCheck_randomMatrix_randomRatio();
                if(this._errorNumber === 0){
                    this,this.slicedGroupsFromRandomMatrix_ramdomRatio();
                };
            };
        };
    };

    /**
     * アクセサ this._slicedGroups
     * @returns {Array.<Array.<{key:string, value:number}>>}
     */
    slicedGroups(){
        return this._slicedGroups;
    };

    /**
     * アクセサ this._valid
     * @returns {number}
     */
    errorNumber(){
        return this._errorNumber;
    };
};

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 集団に要素をランダムに割り当てる
 * @param {Array.<{key:string, value:number}>} materialAmounts
 * @param {Array.<{key:string, value:number}>} groupAmounts
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

class RandomlyAssignToGroups {
    constructor(materialAmounts, groupAmounts){
        this._materialAmounts = materialAmounts;
        this._groupAmounts = groupAmounts;
        this._sumValue = {};
    };

    /**
     * 要素と集団の合計を出す
     */
    settingSumValues(){
        this._sumValue.material = this._materialAmounts.reduce((p, cObj) => p + cObj.value, 0);
        this._sumValue.group    = this._groupAmounts.reduce((p, cObj) => p + cObj.value, 0);        
    };

    //集団の合計が要素よりも多い場合は、グループの受入数を減らす
    resetGroupAmounts(){
        const ratio = this._sumValue.material / this._sumValue.group;
        const _groupAmounts = this._groupAmounts.map((obj) => {
            return {
                key: obj.key,
                value: Math.round(obj.value * ratio)
            };
        });
        this._groupAmounts = _groupAmounts.filter(obj => obj.value > 0);
    };

    /**
     * 要素をランダムに振り分ける
     * [A,A,A,B,B,B,C,C,...]をランダムに並び替える
     */
    shuffledMaterials(){
        return this._materialAmounts.reduce((pArr, cObj) => {
            return pArr.concat(Array.from({length:cObj.value}).fill(JSON.stringify(cObj.key)));
        }, []).reduce((pArr, c) => {
            pArr.splice(Math.floor(Math.random() * (pArr.length + 1)), 0, c);
            return pArr;
        }, []);
    };

    /**
     * ランダムに並び替えた要素配列をグループの受入数ごとに分割して[[A,B,B,C],[A,B,C,C],...]にする
     * @param {Array.<string>} arr 
     * @param {Array.<number>} indexArr 
     * @param {Array.<string>} slicedArr 
     * @param {number} index 
     * @returns {Array.<string>}
     */
    sliceArray(arr, indexArr = [], slicedArr = [], index = 0){
        if(index < indexArr.length){
            slicedArr.push(arr.slice(0, indexArr[index]));
            return this.sliceArray(arr.slice(indexArr[index]), indexArr, slicedArr, ++index);
        }
        else{
            return slicedArr;
        };
    };

    /**
     * [[A,B,B,C],[A,B,C,C],...]を[[{key:A,value:1},{key:B,value:2},{key:C,value:1}],[...],...]に変換する
     * @param {Array.<Array.<string>>} slicedArray
     * @returns {Array.<Array.<{key:string, value:number}>>}
     */
    materialsByNumber(slicedArray){
        const _materialsObj = this._materialAmounts.reduce((pObj, cObj) => {
            pObj[JSON.stringify(cObj.key)] = {key:cObj.key.join(','), value:0};
            return pObj;
        }, {});

        return slicedArray.map((arr) => {
            const slicedObj = arr.reduce((pObj, c) => {
                pObj[c].value += 1;
                return pObj;
            }, JSON.parse(JSON.stringify(_materialsObj)));
            return Object.values(slicedObj);
        });
    };

    /**
     * 要素にふりわけるための一連の操作
     */
    newSlicedGroup(){
        const _shuffledMaterials = this.shuffledMaterials();
        const _groups = this._groupAmounts.map((obj) => obj.value);
        const _slicedArray = this.sliceArray(_shuffledMaterials, _groups);
        this._slicedGroup = this.materialsByNumber(_slicedArray);
    };

    /**
     * メインメソッド
     */
    main(){
        this.settingSumValues();
        if(this._sumValue.fixedMatrix < this._sumValue.group){
            this.resetGroupAmounts();
        };
        this.newSlicedGroup();
    };

    /**
     * アクセサ
     * @returns {Array.<Array.<{key:string, value:number}>>}
     */
    slicedGroup(){
        return this._slicedGroup;
    };
};


/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 結果をテキストファイルにしてダウンロード
 * @param {{str:string, value:Object}} result
 * @param {Object} params
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class DownloadResult {
    constructor(result, params){
        this._resultsStr = result.str;
        this._results    = result.value;
        this._params     = params;
    };

    /**
     * 初期化
     */
    initialize(){
        this._downloadText = '';
        this._downloadResults = {};
        this.dataType();
    };

    /**
     * 分析データのidと名前を取得
     */
    dataType(){
        const ids = Array.from(document.getElementsByClassName('showData'), node => node.id.replace(/^result-/, ''));
        const titles = Array.from(document.getElementsByClassName('showTitle'), node => node.textContent);
        this._dataType = ids.map((value, index) => {
            return {id:value, title:titles[index]};
        });
    };

    /**
     * チェックボックスのチェックがある要素のみ残す
     */
    getChecked(){
        this._filteredDataType = this._dataType.filter((obj) => {
            return  document.getElementById(`dlData_${obj.id}`).checked;
        });
    };

    /**
     * 条件パラメータの文字列を作成
     * @returns {string}
     */
    createParamStr(){
        const createParamsString = new CreateParamsString(this._params, this._results);
        createParamsString.main();
        return createParamsString.paramsStr();
    };

    /**
     * 結果文字列を作成
     */
    createDownloadResults(){
        let results = Array.from({length:this._params.loopCount}, (_, index) => {
            return this._filteredDataType.map((obj) => {
                return this._resultsStr[obj.id][index];
            }).join('\t');
        });
        results.unshift(this._filteredDataType.map(obj => obj.title).join('\t'));
        results.unshift(this.createParamStr());
        this._downloadText = results.join('\n');
    };

    /**
     * ファイル名作成
     * @returns {string}
     */
    createFileName(){
        let fileName = document.getElementById('fileName').value.replace(/[\\\/:\*\?"<>\|]|^\./g, '_');
        if(fileName === ''){
            fileName = 'result.txt';
        };
        if(!/.*\.txt$/.test(fileName)){
            fileName += '.txt';
        };
        return fileName;
    };

    /**
     * ダウンロード実行
     */
    downloadText(){
        let arr = Array.from(this._downloadText);
        let blob = new Blob(arr, {type:"text/plan"});
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.createFileName();
        link.click();
    };

    /**
     * メインメソッド
     */
    main(){
        this.initialize();
        this.getChecked();
        this.createDownloadResults();
        this.downloadText();
    };
};


/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc ダウンロードテキストに記載する条件の文字列を作成
 * @param {Object} params
 * @param {Object} results
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class CreateParamsString {
    constructor(params, results){
        this._params        = params;
        this._groupCount   = params.groupCount;
        this._domain       = params.domain;
        this._loopCount    = params.loopCount;
        this._optionsValue = params.options;
        this._materials    = params.materials;
        this._results      = results;
    };

    /**
     * 定義域
     * @returns {string}
     */
    domainString(){
        const str = JSON.stringify(this._domain).replace(/^\[|"|\]$/g, '');
        return `定義域: ${str}`;
    };

    /**
     * 要素
     * @returns {string}
     */
    materialsString(){
        const materials = this._results.slicedGroups[0].flat().reduce((pObj, cObj) => {
            const keyName = JSON.stringify(cObj.key).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
            pObj[keyName] = (keyName in pObj ? pObj[keyName] : 0) + cObj.value;
            return pObj;
        }, {});
        return `要素の内訳: ${JSON.stringify(materials).replace(/"/g, '')}`;
    };

    /**
     * 集団
     * @returns {string}
     */
    groupsString(){
        if(this._optionsValue.importValue === 'fixed' || this._optionsValue.importRatio === 'fixed'){
            const group = this._results.slicedGroups[0].reduce((pObj, cArray) => {
                const amount =  cArray.reduce((p, cObj) => p + cObj.value, 0);
                const keyName = `要素数${amount}の集団`;
                pObj[keyName] = (keyName in pObj ? pObj[keyName] : 0) + 1;
                return pObj;
            }, {});
            return `集団の内訳: 集団x${this._groupCount}|${JSON.stringify(group).replace(/"/g, '').replace(/:/g, 'x')}`;
        }
        else{
            return `集団の内訳: ランダムな数x${this._groupCount}`;
        };
    };

    /**
     * 試行回数
     * @returns {string}
     */
    loopCountString(){
        return `試行回数: ${this._loopCount}回`;
    };

    /**
     * 全部の文字列を連結
     */
    addAll(){
        this._paramsStr = [
            this.domainString(),
            this.materialsString(),
            this.groupsString(),
            this.loopCountString()
        ].join('\n');
    };

    /**
     * メインメソッド
     */
    main(){
        this.addAll();
    };

    /**
     * アクセサ this._paramsStr
     * @returns {string}
     */
    paramsStr(){
        return this._paramsStr;
    };
};
