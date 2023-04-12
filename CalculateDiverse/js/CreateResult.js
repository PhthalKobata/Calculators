'use strict'

class CreateRandomSlicedArray {
    constructor(groupCount, domain){
        this._groupCount = groupCount;
        this._domain = domain;
    };

    //フォームから要素を取り出す。ついでに各定義域に属する要素の合計を出す。
    createMaterials(){
        this._materials = this._domain.flat().map((value, index) => {
            let num = document.getElementById(`randomMaterial-r${index + 1}c1`).value;
            let dindex = this._domain.findIndex(arr => arr.includes(value));
            return {material:value, amount:Number(num | 0), domainIndex:dindex};
        });

        this._materialAmountEachDomain = this._materials.reduce((pArray, cObj) => {
            pArray[cObj.domainIndex] += cObj.amount;
            return pArray;
        }, Array.from({length:this._domain.length}, () => 0));
    };

    //フォームから各グループに含まれる定義域事の要素数を取り出す。ついでに各定義域ごとに合計を出す。
    createGroupsManual(){
        this._groups = [];
        this._domain.forEach((_, index) => {
            let num;
            for(let row = 0; row < this._groupCount; row++){
                num = document.getElementById(`randomGroup-r${row + 1}c${index + 1}`).value;
                this._groups.push({group:row, amount:Number(num || 0), domainIndex:index});
            };
        });

        this._groupAmountEachDomain = this._groups.reduce((pArray, cObj) => {
            pArray[cObj.domainIndex] += cObj.amount;
            return pArray;
        }, Array.from({length:this._domain.length}, () => 0));
    };

    //グループの大きさと要素の数をそろえる
    normalizeAmount(){
        const normalize = this._domain.map((_, index) => {
            let material = this._materialAmountEachDomain[index];
            let group    = this._groupAmountEachDomain[index];
            const obj = {material:1, group:1};
            if(material !== 0 && group !== 0){
                if(material > group){
                    obj.group = material / group;
                };
                if(group > material){
                    obj.material = group / material;
                };
            };
            return obj;
        });
        this._materials.forEach((obj) => {
            obj.amount = Math.round(obj.amount * normalize[obj.domainIndex].material);
        });
        this._groups.forEach((obj) => {
            obj.amount = Math.round(obj.amount * normalize[obj.domainIndex].group);
        });
    };

    //要素の数をもとにグループをランダムに振り分ける
    createGroupsRandom(){
        this._groups = [];
        this.changeGroupCount();
        this._materialAmountEachDomain.forEach((value, index) => {
            this.createRandomSplit(value - this._groupCount, this._groupCount).forEach((value2, index2) => {
                this._groups.push({group:index2, amount:value2 + 1, domainIndex:index});
            });
        });
    };

    createRandomSplit(maxValue, length){
        const randomInt = [0, maxValue].concat(Array.from({length:length - 1}, () => {
            return Math.floor(Math.random() * maxValue);
        })).sort((a, b) => a - b);
        let diffs = [];
        for(let i = 1; i < randomInt.length; i++){
            diffs.push(randomInt[i] - randomInt[i - 1]);
        };
        return diffs;
    };

    //ある定義域の要素の個数よりもグループの数が多い場合はグループを減らす
    changeGroupCount(){
        let minAmountEachDomain = Math.min(...this._materialAmountEachDomain);
        if(minAmountEachDomain < this._groupCount){
            this._groupCount = minAmountEachDomain;
        };
    };

    //要素をランダムに並べ替える
    createRandomMaterial(){
        this._randomMaterialArray = Array.from({length:this._domain.length}, () => []);
        this._materials.forEach((obj) => {
            let arr = this._randomMaterialArray[obj.domainIndex];
            for(let i = 0; i < obj.amount; i++){
                arr.splice(Math.floor(Math.random() * (arr.length + 1)), 0, obj.material);                
            };
        });
    };

    createSlicesGroup(){
        const defaultGroup = {};
        this._domain.flat().forEach((value) => {
            defaultGroup[value] = 0;
        });

        this._slicedGroup = Array.from({length:this._groupCount}, () => {
            return JSON.parse(JSON.stringify(defaultGroup));
        });
        let randomMaterialArray = JSON.parse(JSON.stringify(this._randomMaterialArray));
        this._groups.forEach((obj) => {
            let slicedArray1 = randomMaterialArray[obj.domainIndex].slice(0, obj.amount);
            let slicedArray2 = randomMaterialArray[obj.domainIndex].slice(obj.amount);
            randomMaterialArray[obj.domainIndex] = slicedArray2;
            slicedArray1.forEach((material) => {
                this._slicedGroup[obj.group][material] += 1;
            });
        });
    };

    slicedGroup(){
        return this._slicedGroup;
    };

    debug(){
        let str = `
            this._materials:${JSON.stringify(this._materials)}
            this._materialAmountEachDomain:${JSON.stringify(this._materialAmountEachDomain)}
            this._groups:${JSON.stringify(this._groups)}
            this._groupAmountEachDomain:${JSON.stringify(this._groupAmountEachDomain)}
            this._randomMaterialArray:${JSON.stringify(this._randomMaterialArray)}
        `
        console.log(str);
    };
};

class CreateResult {
    constructor(parameters){
        this._groupCount = parameters.groupCount;
        this._domain = parameters.domains;
        this._loopCount = parameters.loopCount;
        this._optionsValue = parameters.options;
    };

    slicedGroupsFromManualMatrix(){
        const allDomain = this._domain.flat();
        let materialGroup = [];
        let obj, num;
        for(let r = 0; r < this._groupCount; r++){
            obj = {};
            for(let c = 0; c < allDomain.length; c++){
                num = document.getElementById(`manualMatrix-r${r + 1}c${c + 1}`).value;
                obj[allDomain[c]] = Number(num || 0);
            };
            materialGroup.push(obj);
        };
        this._slicedGroup.push(materialGroup);
    };

    slicedGroupsFromManualRatio(){
        const createRandomSlicedArray = new CreateRandomSlicedArray(this._groupCount, this._domain);
        createRandomSlicedArray.createMaterials();
        createRandomSlicedArray.createGroupsManual();
        createRandomSlicedArray.normalizeAmount();
        for(let i = 0; i < this._loopCount; i++){
            createRandomSlicedArray.createRandomMaterial();
            createRandomSlicedArray.createSlicesGroup();
            this._slicedGroup.push(createRandomSlicedArray.slicedGroup());
        };
    };

    slicedGroupsFromRandomRatio(){
        const createRandomSlicedArray = new CreateRandomSlicedArray(this._groupCount, this._domain);
        createRandomSlicedArray.createMaterials();
        for(let i = 0; i < this._loopCount; i++){
            createRandomSlicedArray.createGroupsRandom();
            createRandomSlicedArray.createRandomMaterial();
            createRandomSlicedArray.createSlicesGroup();
            this._slicedGroup.push(createRandomSlicedArray.slicedGroup());    
        };
    };

    calculate(){
        this._results = {eachDiverse:[], averageDiverse:[], btwGroups:[]};
        this._results.slicedGroups = this._slicedGroup;
        let calculateDiverse =null;
        for(let i = 0; i < this._loopCount; i++){
            calculateDiverse = new CalculateDiverseOfProduct(this._slicedGroup[i], this._domain);
            calculateDiverse.main();
            this._results.eachDiverse.push(calculateDiverse.eachDiverse());
            this._results.averageDiverse.push(calculateDiverse.averageDiverse());
            this._results.btwGroups.push(calculateDiverse.diverseBtwGroups());
        };
    };

    showResults(){
        document.getElementById('result-btw').innerHTML = this._results.btwGroups.slice(0,100).join('<br>');
        document.getElementById('result-ave').innerHTML = this._results.averageDiverse.slice(0,100).join('<br>');
        document.getElementById('result-each').innerHTML = this._results.eachDiverse.slice(0,100).map(value => JSON.stringify(value)).join('<br>');
        document.getElementById('result-group').innerHTML = this._slicedGroup.slice(0,100).map(value => JSON.stringify(value)).join('<br>').replace(/"/g,'');
    };

    createParams(){
        this._params = {
            domain: JSON.stringify(this._domain).replace(/"|^\[|\]$/g, ''),
            loopCount: this._loopCount
        };

        const allDomains = this._domain.flat();
        const materials = this._slicedGroup[0].reduce((pObj, cObj) => {
            allDomains.forEach((key) => {
                pObj[key] = (pObj[key] || 0) + cObj[key];
            });
            return pObj;
        }, {});
        this._params.material = JSON.stringify(materials).replace(/"/g, '');
        
        if(this._optionsValue.importValue === 'manual'){
            this._params.group = JSON.stringify(this._slicedGroup[0]).replace(/"/g, '');
        }
        else{
            if(this._optionsValue.importRatio === 'manual'){
                const amountOfDomainEachGroup = this._slicedGroup[0].reduce((grObjArr, gr) => {
                    const obj = this._domain.reduce((grObj, domain) => {
                        grObj[JSON.stringify(domain).replace(/"/g, '')] = domain.reduce((amount, material) => amount + gr[material], 0);
                        return grObj;
                    }, {});
                    grObjArr.push(JSON.stringify(obj).replace(/"/g, ''));
                    return grObjArr;
                }, []).reduce((pObj, c) => {
                    pObj[c] = c in pObj ? pObj[c] + 1 : 1;
                    return pObj;
                }, {});
                this._params.group = JSON.stringify(amountOfDomainEachGroup).replace(/"|^\{|\}$/g, '').replace(/:/g, 'x');
            }
            else{
                this._params.group = `ランダムな数x${this._groupCount}`;
            };
        };
    };

    main(){
        this._slicedGroup = [];
        if(this._optionsValue.importValue === 'manual'){
            this.slicedGroupsFromManualMatrix();
        }
        else{
            if(this._optionsValue.importRatio === 'manual'){
                this.slicedGroupsFromManualRatio();
            }
            else{
                this.slicedGroupsFromRandomRatio();
            };
        };
        this.calculate();
        this.showResults();
        this.createParams();
    };

    results(){
        return this._results;
    };

    params(){
        return this._params;
    };
};

class DownloadResult {
    constructor(results, params){
        this._results = results;
        this._params = params;
    };

    initialize(){
        this._downloadText = '';
        this._downloadResults = {};
        this._titles = ['集団間の多様性','集団内多様性の平均','各集団内の多様性','各集団内の要素の内訳'];
    };

    getChecked(){
        ['btwGroups', 'averageDiverse', 'eachDiverse', 'slicedGroups'].forEach((id, index) => {
            if(document.getElementById(id).checked){
                this._downloadResults[id] = this._results[id];
            }
            else{
                this._downloadResults[id] = this._results[id].map(() => '');
                this._titles[index] = '';
            };
        });
    };

    createParamStr(){
        return [
            `定義域: ${this._params.domain}`,
            `要素の内訳: ${this._params.material}`,
            `集団の内訳: ${this._params.group}`,
            `試行回数: ${this._params.loopCount}回`
        ].join('\n');
    };

    createDownloadResults(){
        let results = Array.from({length:this._params.loopCount}, (_, index) => {
            return [
                this._downloadResults.btwGroups[index],
                this._downloadResults.averageDiverse[index],
                JSON.stringify(this._downloadResults.eachDiverse[index]).replace(/[\[\]]/g, ''),
                JSON.stringify(this._downloadResults.slicedGroups[index]).replace(/[\[\]"]/g, '')
            ].join(' ').replace(/^ *| *$| +(?= )/g, '');
        });
        results.unshift(this._titles.join(' ').replace(/^ *| *$| +(?= )/g, ''));
        results.unshift(this.createParamStr());
        this._downloadText = results.join('\n');
    };

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