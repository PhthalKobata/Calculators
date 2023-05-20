'use strict'

class CalculateSlicedGroup {
    constructor(materialAmounts, groupAmounts){
        this._materialAmounts = materialAmounts;
        this._groupAmounts = groupAmounts;
        this._sumValue = {};
    };

    //要素と手グループの合計を出す
    settingSumValues(){
        this._sumValue.material = this._materialAmounts.reduce((p, cObj) => p + cObj.value, 0);
        this._sumValue.group    = this._groupAmounts.reduce((p, cObj) => p + cObj.value, 0);        
    };

    //グループの合計が要素よりも多い場合は、グループの受入数を減らす
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

    //要素をランダムに振り分ける
    /**
     * [A,A,A,B,B,B,C,C,...]をランダムに並び替える
     * これをグループの受入数ごとに分割して[[A,B,B,C],[A,B,C,C],...]にする
     * これを{"[A,x]":{key:[A,x], value:3},...}とかにしてObject.valuesする
     */

    shuffledMaterials(){
        return this._materialAmounts.reduce((pArray, cObj) => {
            return pArray.concat(Array.from({length:cObj.value}).fill(JSON.stringify(cObj.key)));
        }, []).reduce((pArray, c) => {
            pArray.splice(Math.floor(Math.random() * (pArray.length + 1)), 0, c);
            return pArray;
        }, []);
    };

    sliceArray(arr, indexArr = [], slicedArr = [], index = 0){
        if(index < indexArr.length){
            slicedArr.push(arr.slice(0, indexArr[index]));
            return this.sliceArray(arr.slice(indexArr[index]), indexArr, slicedArr, ++index);
        }
        else{
            return slicedArr;
        };
    };

    newSlicedGroup(){
        const _shuffledMaterials = this.shuffledMaterials();
        const _groups = this._groupAmounts.map((obj) => obj.value);
        const _slicedArray = this.sliceArray(_shuffledMaterials, _groups);
        const _materialsObj = this._materialAmounts.reduce((pObj, cObj) => {
            pObj[JSON.stringify(cObj.key)] = {key:cObj.key, value:0};
            return pObj;
        }, {});
        this._slicedGroup = _slicedArray.map((arr) => {
            const slicedObj = arr.reduce((pObj, c) => {
                pObj[c].value += 1;
                return pObj;
            }, JSON.parse(JSON.stringify(_materialsObj)));
            return Object.values(slicedObj);
        });
    };

    main(){
        this.settingSumValues();
        if(this._sumValue.manualMatrix < this._sumValue.group){
            this.resetGroupAmounts();
        };
        this.newSlicedGroup();
    };

    slicedGroup(){
        return this._slicedGroup;
    };
};



class CreateSlicedGroups {
    constructor(parameters){
        this._groupCount   = parameters.groupCount;
        this._domain       = parameters.domains;
        this._loopCount    = parameters.loopCount;
        this._optionsValue = parameters.options;
        this._materials    = parameters.materials;
        this._tableProp    = parameters.tableProp;
        this._slicedGroups = [];
    };

    //テーブルから数値を取得する
    getMaterialsAmounts_detail(){
        this._materialAmounts = this._materials.map((value, index) => {
            let v = document.getElementById(`randomMatrix_material-r${index + 1}c1`).value;
            return {
                key: value, 
                value: Number(v || 0)
            };
        });
        this._materialAmountsEachDomain = [this._materialAmounts.reduce((p, cObj) => p + cObj.value, 0)];
    };

    //テーブルから数値を取得する
    getMaterialsAmounts_simple(){
        const _materialAmountsEachDomain = this._domain.map((domain, index_c) => {
            return domain.map((value, index_r) => {
                let v = document.getElementById(`randomMatrix_material-r${index_r + 1}c${index_c + 1}`).value;
                return {
                    key: value,
                    value: Number(v || 0)
                };
            });
        });
        this._materialAmounts = _materialAmountsEachDomain.flat();
        this._materialAmountsEachDomain = _materialAmountsEachDomain.map((objArray) => {
            return objArray.reduce((p, cObj) => p + cObj, 0);
        });
    };

    //テーブルから数値を取得する
    getGroupAmounts(){
        this._groupAmounts = Array.from({length:this._tableProp.randomMatrix_group.row - 1}, (_, index) => {
            let v = document.getElementById(`randomMatrix_group-r${index + 1}c1`).value;
            return {
                key: `group${index + 1}`,
                value: Number(v || 0)
            };
        });
    };

    //各定義域の要素がすべて同じかを判定
    equalEachAmounts(){
        return  Array.from(new Set(this._materialAmountsEachDomain)).length === 1;
    };

    //集団の要素数がランダムのときに集団の要素数を決定する
    createGroupAmounts(){
        const maxValue = this._materialAmountsEachDomain[0];
        const randomInt = [0, maxValue].concat(Array.from({length:this._groupCount - 1}, () => {
            return Math.floor(Math.random() * maxValue);
        })).sort((a, b) => a - b);
        this._groupAmounts = [];
        for(let i = 1; i < randomInt.length; i++){
            this._groupAmounts.push({key:`group${i}`, value:(randomInt[i] - randomInt[i - 1])});
        };
    };

    /** slicedGroup:[[[{key:[a,x], value:2},{...},...],[{...},{...},...],...],[...],...]を作成
     * 集団の内訳の配列：[{key:[a,x], value:2},{...},...]
     * 系の内訳の配列　：[[集団1の内訳],[集団2の内訳],...]
     * ループによる配列：[[系の内訳1ループ目],[系の内訳2ループ目],...]
     * [[[{...},{...}],[{...},{...}]],[[{...},{...}],[{...},{...}]]]
    */
    slicedGroupsFromManualMatrix(){
        let group = null;
        let _slicedGroup = [];
        for(let r = 1; r < this._tableProp.manualMatrix.row; r++){
            group = this._materials.map((keys, index) => {
                let v = document.getElementById(`manualMatrix-r${r}c${index + 1}`).value;
                return {
                    key: keys,
                    value: Number(v || 0)
                };
            });
            _slicedGroup.push(group);
        };
        this._slicedGroups = [_slicedGroup];
    };

    slicedGroupsFromRandomMatrix(){
        if(this._optionsValue.analysisType === 'detail'){
            this.getMaterialsAmounts_detail();
        };
        if(this._optionsValue.analysisType === 'simple'){
            this.getMaterialsAmounts_simple();
        };
        if(this._optionsValue.importRatio === 'manual'){
            this.getGroupAmounts();
        };
        if(this.equalEachAmounts()){
            for(let i = 0; i < this._loopCount; i++){
                if(this._optionsValue.importRatio === 'random'){
                    this.createGroupAmounts();
                };
                this.calculateSlicedGroup();        
            };
        }
        else{
            window.alert('各定義域の要素数を同じにしてください');
        };
    };

    calculateSlicedGroup(){
        const calculateSlicedGroup = new CalculateSlicedGroup(this._materialAmounts, this._groupAmounts);
        calculateSlicedGroup.main();
        this._slicedGroups.push(calculateSlicedGroup.slicedGroup());
    };

    main(){
        if(this._optionsValue.importValue === 'manual'){
            this.slicedGroupsFromManualMatrix();
        };
        if(this._optionsValue.importValue === 'random'){
            this.slicedGroupsFromRandomMatrix();
        };
    };

    slicedGroups(){
        return this._slicedGroups;
    };
};


class CreateResult {
    constructor(parameters){
        this._params       = parameters;
        this._groupCount   = parameters.groupCount;
        this._domain       = parameters.domains;
        this._loopCount    = parameters.loopCount;
        this._optionsValue = parameters.options;
        this._materials    = parameters.materials;
    };

    initialize(){
        const keys = ['each_detail','each_simple','ave_detail','ave_simple','btw_detail','btw_simple','sd_detail','sd_simple'];
        this._results = keys.reduce((pObj, c) => {
            pObj[c] = [];
            return pObj;
        }, {});
    };

    //SlicedGroupsを作成
    createSlicedGroups(){
        const createSlicedGroups = new CreateSlicedGroups(this._params);
        createSlicedGroups.main();
        this._slicedGroups = createSlicedGroups.slicedGroups();
        this._results.slicedGroups = this._slicedGroups.map(slicedGroup => this.deleteEmptyGroup(slicedGroup));
    };

    //多様性を計算
    calculateDiverse(slicedGroup){
        const calculateDiverse = new CalculateDiverse(slicedGroup, this._domain);
        calculateDiverse.main();
        const _results = calculateDiverse.results();

        this._results.each_simple.push(_results.each_simple);
        this._results.ave_simple.push(_results.ave_simple);
        this._results.btw_simple.push(_results.btw_simple);
        this._results.sd_simple.push(_results.sd_simple);

        if(this._optionsValue.analysisType === 'detail'){
            this._results.each_detail.push(_results.each_detail);
            this._results.ave_detail.push(_results.ave_detail);
            this._results.btw_detail.push(_results.btw_detail);
            this._results.sd_detail.push(_results.sd_detail);
        };

        if(this._optionsValue.analysisType === 'simple'){
            this._results.each_detail.push([]);
            this._results.ave_detail.push(-1);
            this._results.btw_detail.push(-1);    
            this._results.sd_detail.push(-1);
        };
    };

    deleteEmptyGroup(slicedGroup){
        return slicedGroup.filter((grArr) => {
            return grArr.reduce((p, cObj) => p + cObj.value, 0) !== 0;
        });
    }

    //ループ回数分計算
    calculate(){
        this._results.slicedGroups.forEach((slicedGroup) => {
            this.calculateDiverse(slicedGroup);
        });
    };

    //SlicedGroupの[{key:x, value:1},{key:y, value:2}]を{x:1, y:2}に変える
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

    //計算結果を文字列に変換
    convertResultsStr(){
        this._resultsStr = JSON.parse(JSON.stringify(this._results));
        this._resultsStr.each_detail = this._results.each_detail.map(arr => JSON.stringify(arr).replace(/"/g, ''));
        this._resultsStr.each_simple = this._results.each_simple.map(arr => JSON.stringify(arr).replace(/"/g, ''));
        this._resultsStr.slicedGroups = this._results.slicedGroups.map(value => this.convertToSlicedGroupString(value));
    };

    //結果を表示
    showResults(){
        Object.keys(this._resultsStr).forEach((keyName) => {
            document.getElementById(`result-${keyName}`).innerHTML = this._resultsStr[keyName].slice(0,100).join('<br>');
        });
    };

    main(){
        this.initialize();
        this.createSlicedGroups();
        this.calculate();
        this.convertResultsStr();
        this.showResults();
    };

    result(){
        return {
            value: this._results,
            str: this._resultsStr
        };
    };

    params(){
        return this._params;
    };
};



class CreateParamsString {
    constructor(parameters, results){
        this._parms        = parameters;
        this._groupCount   = parameters.groupCount;
        this._domain       = parameters.domains;
        this._loopCount    = parameters.loopCount;
        this._optionsValue = parameters.options;
        this._materials    = parameters.materials;
        this._results      = results;
    };

    domainString(){
        const str = JSON.stringify(this._domain).replace(/^\[|"|\]$/g, '');
        return `定義域: ${str}`;
    };

    materialsString(){
        const materials = this._results.slicedGroups[0].flat().reduce((pObj, cObj) => {
            const keyName = JSON.stringify(cObj.key).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
            pObj[keyName] = (keyName in pObj ? pObj[keyName] : 0) + cObj.value;
            return pObj;
        }, {});
        return `要素の内訳: ${JSON.stringify(materials).replace(/"/g, '')}`;
    };

    groupsString(){
        if(this._optionsValue.importValue === 'manual' || this._optionsValue.importRatio === 'manual'){
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

    loopCountString(){
        return `試行回数: ${this._loopCount}回`;
    };

    addAll(){
        this._paramsStr = [
            this.domainString(),
            this.materialsString(),
            this.groupsString(),
            this.loopCountString()
        ].join('\n');
    };

    main(){
        this.addAll();
    };

    paramsStr(){
        return this._paramsStr;
    };
};


class DownloadResult {
    constructor(result, params){
        this._resultsStr = result.str;
        this._results    = result.value;
        this._params     = params;
    };

    initialize(){
        this._downloadText = '';
        this._downloadResults = {};
        this._dataType = [
            {title:'集団間の多様性（詳細分析）', data:'btwGroups', type:'detail', key:'btw_detail'},
            {title:'集団内多様性の平均（詳細分析）', data:'averageDiverse', type:'detail', key:'ave_detail'},
            {title:'集団内多様性の標準偏差（詳細分析）', data:'sdDiverse', type:'detail', key:'sd_detail'},
            {title:'集団間の多様性（簡易分析）', data:'btwGroups', type:'simple', key:'btw_simple'},
            {title:'集団内多様性の平均（簡易分析）', data:'averageDiverse', type:'simple', key:'ave_simple'},
            {title:'集団内多様性の標準偏差（簡易分析）', data:'sdDiverse', type:'simple', key:'sd_simple'},
            {title:'各集団内の多様性（詳細分析）', data:'eachDiverse', type:'detail', key:'each_detail'},
            {title:'各集団内の多様性（簡易分析）', data:'eachDiverse', type:'simple', key:'each_simple'},
            {title:'集団の内訳', data:'slicedGroups', type:'', key:'slicedGroups'}
        ]
    };

    //チェックボックスのチェックがある要素のみ残す
    getChecked(){
        this._filteredDataType = this._dataType.filter((obj) => {
            let checked_data = document.getElementById(`dlData_${obj.data}`).checked;
            let checked_type = obj.type === '' || document.getElementById(`dlData_${obj.type}`).checked;
            return checked_data && checked_type;
        });
    };

    //条件パラメータの文字列を作成
    createParamStr(){
        const createParamsString = new CreateParamsString(this._params, this._results);
        createParamsString.main();
        return createParamsString.paramsStr();
    };

    //結果文字列を作成
    createDownloadResults(){
        let results = Array.from({length:this._params.loopCount}, (_, index) => {
            return this._filteredDataType.map((obj) => {
                return this._resultsStr[obj.key][index];
            }).join(' ');
        });
        results.unshift(this._filteredDataType.map(obj => obj.title).join(' '));
        results.unshift(this.createParamStr());
        this._downloadText = results.join('\n');
    };

    //ファイル名作成
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

    //ダウンロード実行
    downloadText(){
        let arr = Array.from(this._downloadText);
        let blob = new Blob(arr, {type:"text/plan"});
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.createFileName();
        link.click();
    };

    main(){
        this.initialize();
        this.getChecked();
        this.createDownloadResults();
        this.downloadText();
    };
};