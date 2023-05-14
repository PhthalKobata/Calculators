'use strict';

class CreateForm {
    constructor(){
        this._domainIds = ['domain0'];
    };

    initialize(){
        this._optionsValue = {analysisType:'none', importValue:'none', importRatio:'none'};
        this._materials = [];
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
    };

    //フォームから値を取得

    addDomain(){
        const domainText = {};
        this._domainIds.forEach((id) => {
            domainText[id] = document.getElementById(id).value;
        });
        let newIndex = this._domainIds.length;
        let newId = `domain${newIndex}`;
        this._domainIds.push(newId);
        let newInput = `<input type="text" id="${newId}" style="width:500px" value=""><br>`;
        document.getElementById('domain').innerHTML += newInput;
        Object.keys(domainText).forEach((id) => {
            document.getElementById(id).value = domainText[id];
        });
    };

    getGroupCount(){
        let value = document.getElementById('groupCount').value;
        this._groupCount = Number(value);
    };

    getLoopCount(){
        let value = document.getElementById('loopCount').value;
        this._loopCount = Number(value);
    };

    getOptions(){
        this._optionsValue.analysisType = this.getSelectedOptions('analysisType');
        this._optionsValue.importValue = this.getSelectedOptions('importValue');
        if(this._optionsValue.importValue === 'random'){
            this._optionsValue.importRatio = this.getSelectedOptions('importRatio');
        };
    };

    getSelectedOptions(name){
        const options = document.getElementsByName(name);
        for(let option of options){
            if(option.checked){
                return option.value;
            };
        };
    };

    getDomains(){
        this._domainIds.forEach((id) => {
            let arr = document.getElementById(id).value.replace(/(,| )+/g, ',').split(',').filter(value => value !== '');
            if(arr.length !== 0){
                this._domain.push(Array.from(new Set(arr)));
            };
        });
    };

    //定義域に重複がないかをチェック
    checkDomain(){
        const allDomains = this._domain.flat();
        this._valid = allDomains.length === Array.from(new Set(allDomains)).length;
    };

    detailedMaterials(i = 0, current = []){
        if(i === this._domain.length){
            this._materials.push(current);
        }
        else{
            for(let j = 0; j < this._domain[i].length; j++) {
                this.detailedMaterials(i + 1, [...current, this._domain[i][j]]);
            };
        };
    };

    simpleMaterials(){
        this._materials = this._domain.reduce((pArray, cArray, index, myArray) => {
            cArray.forEach((value) => {
                let newArray = Array.from({length:myArray.length}, () => '');
                newArray[index] = value;
                pArray.push(newArray);
            });
            return pArray;
        }, []);
    };

    getProperties(){
        this.getGroupCount();
        this.getDomains();
        this.getLoopCount();
        this.getOptions();
    };

    setMaterials(){
        if(this._optionsValue.analysisType === 'detail'){
            this.detailedMaterials();
        }
        if(this._optionsValue.analysisType === 'simple'){
            this.simpleMaterials();
        };
    };

    showSettingParams(){
        document.getElementById('showDomains').textContent = JSON.stringify(this._domain).replace(/^\[|\]$|"/g, '');
        document.getElementById('showLoopCount').textContent = this._loopCount;
        document.getElementById('showGroupCount').textContent = this._groupCount;
    };

    createInputTable(){
        this._createInputTable = new CreateInputTable(this._materials, this._domain, this._groupCount);
    };

    //テーブルの作成
    showTable(){
        if(this._optionsValue.importValue === 'manual'){
            document.getElementById('loopCount').value = 1;
            this._loopCount = 1;
            document.getElementById('manualTable').style.display = 'block';
            this._createInputTable.manualMatrix();
            this.addAutoButton('manualMatrix', true);
        }
        else{
            document.getElementById('randomTable').style.display = 'block';
            this._createInputTable.randomMatrix_material();
            if(this._optionsValue.importRatio === 'manual'){
                this._createInputTable.randomMatrix_group();
            };
            this.addAutoButton('randomMatrix_material', true);
            this.addAutoButton('randomMatrix_group', this._optionsValue.importRatio === 'manual');
        };
    };

    //テーブルの削除
    removeTable(tbodyId){
        const tbody = document.getElementById(tbodyId);
        while(tbody.firstChild){
            tbody.removeChild(tbody.firstChild);
        };
    };
    
    //自動入力ボタンの追加
    addAutoButton(tbodyId, bool){
        let sentense = "数値の一括入力<br>"
        let textHtml = `<input type="number" id="autoImport_${tbodyId}" class="autoImport" min="0" value="0">`;
        let buttonHtml = `<input type="button" value="一括入力" onclick="autoImport('${tbodyId}')">`;
        document.getElementById(`importButton_${tbodyId}`).innerHTML = (bool ? `${sentense}${textHtml}${buttonHtml}` : '');
    };

    //自動入力
    autoImport(tbodyId){
        this._createInputTable.autoImport(tbodyId);
    };

    main(){
        this.initialize();
        this.getProperties();
        this.setMaterials();
        this.checkDomain();
        if(this._valid){
            this.createInputTable();
            this.showTable();
            this.showSettingParams();    
        }
        else{
            alert("定義域の要素に重複があります");
        };
    };

    parameters(){
        return {
            groupCount:this._groupCount,
            domains:this._domain,
            loopCount:this._loopCount,
            options:this._optionsValue,
            materials: this._materials,
            tableProp: this._createInputTable.tableProp()
        };
    };

    valid(){
        return this._valid;
    };
};


class CreateInputTable {
    constructor(materials, domain, groupCount){
        this.initialize.apply(this, arguments);
    };

    initialize(materials, domain, groupCount){
        this._materials = materials;
        this._domain = domain;
        this._groupCount = groupCount;
        this._detail = this.checkPattern();
        this.createMaterialNames();
        this.setTalbeProperties();
    };

    //各パターンのテーブルの行列の列挙オブジェクト
    setTalbeProperties(){
        this._tableProp = {
            manualMatrix:{
                row   : this._groupCount + 1,
                column: this._materialNames.length + 1
            },
            randomMatrix_material:{
                row   : this._materialNames.length + 1,
                column: 2
            },
            randomMatrix_group:{
                row   :this._groupCount + 1,
                column: 2
            }
        };
        if(!this._detail){
            this._tableProp.randomMatrix_material.column = this._domain.length + 1;
            this._tableProp.randomMatrix_material.row = Math.max(...this._domain.map(domain => domain.length)) + 1;
        };
    };

    //行列に記述するための要素名配列
    createMaterialNames(){
        this._materialNames = this._materials.map((value) => {
            return JSON.stringify(value).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
        });
    };

    //簡易分析において各定義域の要素の合計が全て同じかを判定
    checkPattern(){
        return Array.from(new Set(this._materials.flat())).length === Array.from(new Set(this._domain.flat())).length;
    };

    manualMatrix(){
        this.createTable('manualMatrix', this._tableProp.manualMatrix.row, this._tableProp.manualMatrix.column, (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="">`;
        });
        this._materialNames.forEach((value, index) => {
            document.getElementById(`manualMatrix-r0c${index + 1}`).textContent = value;
        });
        for(let r = 1; r < this._tableProp.manualMatrix.row; r++){
            document.getElementById(`manualMatrix-r${r}c0`).textContent = `Group${r}`;
        };
    };

    //要素数のテーブル作成
    randomMatrix_material(){
        let callback = () => {};
        if(this._detail){
            callback = (tbodyId, r, c) => {
                return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="">`;
            };
        }
        else{
            callback = (tbodyId, r, c) => {
                if(this._domain[c - 1][r - 1] === undefined){
                    return '';
                }
                else{
                    return `${this._domain[c - 1][r - 1]}:<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="">`;
                };
            };
        };

        this.createTable('randomMatrix_material', this._tableProp.randomMatrix_material.row, this._tableProp.randomMatrix_material.column, callback);
        if(this._detail){
            this._materialNames.forEach((value, index) => {
                document.getElementById(`randomMatrix_material-r${index + 1}c0`).textContent = value;
            });
            document.getElementById(`randomMatrix_material-r0c0`).textContent = "要素";
            document.getElementById(`randomMatrix_material-r0c1`).textContent = "個数";            
        }
        else{
            this._domain.forEach((value, index) => {
                document.getElementById(`randomMatrix_material-r0c${index + 1}`).textContent = JSON.stringify(value).replace(/"/g, '');
            });
        };
    };

    //集団のテーブル作成
    randomMatrix_group(){
        this.createTable('randomMatrix_group', this._tableProp.randomMatrix_group.row, this._tableProp.randomMatrix_group.column, (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="">`;
        });
        for(let r = 1; r < this._tableProp.randomMatrix_group.row; r++){
            document.getElementById(`randomMatrix_group-r${r}c0`).textContent = `Group${r}`;
        };
        document.getElementById(`randomMatrix_group-r0c0`).textContent = "グループ";
        document.getElementById(`randomMatrix_group-r0c1`).textContent = "要素数";
    };

    //実際にテーブルを作成するメソッド。コールバックはtdの中身
    createTable(tbodyId, row, column, callback_tdInnerHTML){
        const tbody = document.getElementById(tbodyId);
        for(let r = 0; r < row; r++){
            let tr = document.createElement('tr');
            for(let c = 0; c < column; c++){
                if(r === 0 || c === 0){
                    let th = document.createElement('th');
                    th.innerHTML = `<span id="${tbodyId}-r${r}c${c}"></span>`;
                    tr.appendChild(th);
                }
                else{
                    let td = document.createElement('td');
                    td.innerHTML = callback_tdInnerHTML(tbodyId, r, c);
                    tr.appendChild(td);    
                };
            };
            tbody.appendChild(tr);
        };
    };

    //自動入力
    autoImport(tbodyId){
        let value = document.getElementById(`autoImport_${tbodyId}`).value;
        let prop = this._tableProp[tbodyId];
        let element = null;
        for(let r = 1; r < prop.row; r++){
            for(let c = 1; c < prop.column; c++){
                element = document.getElementById(`${tbodyId}-r${r}c${c}`);
                if(element !== null || element !== undefined){
                    element.value= Number(value || 0);
                };
            };
        };
    };

    tableProp(){
        return this._tableProp;
    };
};