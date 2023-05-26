'use strict';

/**
 * フォーム作成およびフォーム操作のクラス
 */

class CreateForm {
    constructor(){
        this._domainIds = ['domain0'];
        this._caluclatorCells = [];
        document.getElementById('createTableButton').addEventListener('click', () => {
            this.resizeTable();
        });
    };

    initialize(){
        this._optionsValue = {analysisType:'none', importValue:'none', importRatio:'none'};
        this._materials = [];
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
    };

    //定義域枠の追加
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

    //フォームから値を取得
    getProperties(){
        const createParameters = new CreateParameters(this._domainIds);
        createParameters.main();
        this._params = createParameters.params();
        this._groupCount   = this._params.groupCount;
        this._domain       = this._params.domain;
        this._loopCount    = this._params.loopCount;
        this._optionsValue = this._params.options;
        this._tableProp    = this._params.tableProp;
    };

    //自動計算のインスタンス
    setControlMatrix(){
        this._controlMatrix = {
            manualMatrix:          new ControlMatrix('manualMatrix', this._tableProp),
            randomMatrix_material: new ControlMatrix('randomMatrix_material', this._tableProp),
            randomMatrix_group:     new ControlMatrix('randomMatrix_group', this._tableProp)
        };
    };

    //定義域に重複がないかをチェック
    checkDomain(){
        const allDomains = this._domain.flat();
        this._valid = allDomains.length === Array.from(new Set(allDomains)).length;
    };

    //パラメータの表示
    showSettingParams(){
        document.getElementById('showDomains').textContent = JSON.stringify(this._domain).replace(/^\[|\]$|"/g, '');
        document.getElementById('showLoopCount').textContent = this._loopCount;
        document.getElementById('showGroupCount').textContent = this._groupCount;
    };


    //テーブルの作成
    showTable(){
        const createInputTable = new CreateInputTable(this._params);
        if(this._optionsValue.importValue === 'manual'){
            document.getElementById('loopCount').value = 1;
            this._loopCount = 1;
            document.getElementById('manualTable').style.display = 'block';
            createInputTable.manualMatrix();
            createInputTable.addAutoButton('manualMatrix', true);
        }
        else{
            document.getElementById('randomTable').style.display = 'block';
            createInputTable.randomMatrix_material();
            if(this._optionsValue.importRatio === 'manual'){
                createInputTable.randomMatrix_group();
            };
            createInputTable.addAutoButton('randomMatrix_material', true);
            createInputTable.addAutoButton('randomMatrix_group', this._optionsValue.importRatio === 'manual');
        };
        this._caluclatorCells = createInputTable.caluclatorCells();
    };

    //テーブルの削除
    removeTables(tbodyIds){
        tbodyIds.forEach((tbodyId) => {
            const tbody = document.getElementById(tbodyId);
            while(tbody.firstChild){
                tbody.removeChild(tbody.firstChild);
            };        
        });
    };

    //テーブル幅高さの自動調整
    resizeTable(){
        this._caluclatorCells.forEach((obj) => {
            obj.element.style.height = obj.refCell.offsetHeight + 'px';
            obj.element.style.width = obj.refCell.offsetWidth + 'px';
        });
    };

    //自動入力
    autoImport(tbodyId){
        this._controlMatrix[tbodyId].autoImport();
    };

    //自動計算
    autoCalculate(tbodyId, index_r = -1, index_c = -1){
        this._controlMatrix[tbodyId].autoCalculate(index_r, index_c)
    };

    main(){
        this.initialize();
        this.getProperties();
        this.checkDomain();
        if(this._valid){
            this.showTable();
            this.showSettingParams();    
            this.setControlMatrix();
        }
        else{
            alert("定義域の要素に重複があります");
        };
    };

    params(){
        return this._params;
    };

    valid(){
        return this._valid;
    };
};

/**
 * 入力パラメータを受け取るクラス
 */

class CreateParameters {

    constructor(domainIds){
        this._domainIds = domainIds;
        this._optionsValue = {analysisType:'none', importValue:'none', importRatio:'none'};
        this._materials = [];
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
    };
    //フォームから値を取得

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

    setMaterials(){
        if(this._optionsValue.analysisType === 'detail'){
            this.detailedMaterials();
        }
        if(this._optionsValue.analysisType === 'simple'){
            this.simpleMaterials();
        };
    };

    setTableProperties(){
        this._tableProp = {
            manualMatrix:{
                row   : this._groupCount + 1,
                column: this._materials.length + 1
            },
            randomMatrix_material:{
                row   : this._materials.length + 1,
                column: 2
            },
            randomMatrix_group:{
                row   :this._groupCount + 1,
                column: 2
            }
        };
        if(this._optionsValue.analysisType === 'simple'){
            this._tableProp.randomMatrix_material.column = this._domain.length + 1;
            this._tableProp.randomMatrix_material.row = Math.max(...this._domain.map(domain => domain.length)) + 1;
        };
    };


    main(){
        this.getGroupCount();
        this.getDomains();
        this.getLoopCount();
        this.getOptions();
        this.setMaterials();
        this.setTableProperties();
    };

    params(){
        return {
            groupCount:this._groupCount,
            domain:this._domain,
            loopCount:this._loopCount,
            options:this._optionsValue,
            materials: this._materials,
            tableProp: this._tableProp
        };
    };
};

/**
 * 入力テーブルを作成するクラス
 */

class CreateInputTable {
    constructor(params){
        this.initialize.apply(this, arguments);
    };

    initialize(params){
        this._materials = params.materials;
        this._domain = params.domain;
        this._groupCount = params.groupCount;
        this._detail = params.options.analysisType === 'detail';
        this._tableProp = params.tableProp;
        this._caluclatorCells = [];
        this.createMaterialNames();
    };

    //行列に記述するための要素名配列
    createMaterialNames(){
        this._materialNames = this._materials.map((value) => {
            return JSON.stringify(value).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
        });
    };

    manualMatrix(){
        this.createTable('manualMatrix', (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="" onChange="autoCalculate('${tbodyId}',${r},${c})">`;
        });
        this._materialNames.forEach((value, index) => {
            document.getElementById(`manualMatrix-r0c${index + 1}`).textContent = value;
        });
        for(let r = 1; r < this._tableProp.manualMatrix.row; r++){
            document.getElementById(`manualMatrix-r${r}c0`).textContent = `Group${r}`;
        };
        this.addCalculatorOfColumn('manualMatrix');
        this.addCalculatorOfRow('manualMatrix');
    };

    //要素数のテーブル作成
    randomMatrix_material(){
        let callback = () => {};
        if(this._detail){
            callback = (tbodyId, r, c) => {
                return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="" onChange="autoCalculate('${tbodyId}',${r},${c})">`;
            };
        }
        else{
            callback = (tbodyId, r, c) => {
                if(this._domain[c - 1][r - 1] === undefined){
                    return '';
                }
                else{
                    return `${this._domain[c - 1][r - 1]}:<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="" onChange="autoCalculate('${tbodyId}',${r},${c})">`;
                };
            };
        };

        this.createTable('randomMatrix_material', callback);
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
        this.addCalculatorOfColumn('randomMatrix_material');  
    };

    //集団のテーブル作成
    randomMatrix_group(){
        this.createTable('randomMatrix_group', (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="" onChange="autoCalculate('${tbodyId}',${r},${c})">`;
        });
        for(let r = 1; r < this._tableProp.randomMatrix_group.row; r++){
            document.getElementById(`randomMatrix_group-r${r}c0`).textContent = `Group${r}`;
        };
        document.getElementById(`randomMatrix_group-r0c0`).textContent = "グループ";
        document.getElementById(`randomMatrix_group-r0c1`).textContent = "要素数";
        this.addCalculatorOfColumn('randomMatrix_group');  
    };

    //実際にテーブルを作成するメソッド。コールバックはtdの中身
    createTable(tbodyId, callback_tdInnerHTML){
        const tbody = document.getElementById(tbodyId);
        for(let r = 0; r < this._tableProp[tbodyId].row; r++){
            let tr = document.createElement('tr');
            for(let c = 0; c < this._tableProp[tbodyId].column; c++){
                if(r === 0 || c === 0){
                    let th = document.createElement('th');
                    th.id = `th-${tbodyId}-r${r}c${c}`;
                    th.innerHTML = `<span id="${tbodyId}-r${r}c${c}"></span>`;
                    tr.appendChild(th);
                }
                else{
                    let td = document.createElement('td');
                    td.id = `td-${tbodyId}-r${r}c${c}`;
                    td.innerHTML = callback_tdInnerHTML(tbodyId, r, c);
                    tr.appendChild(td);    
                };
            };
            tbody.appendChild(tr);
        };
    };

    addAutoButton(tbodyId, bool){
        let sentense = "数値の一括入力<br>"
        let textHtml = `<input type="number" id="autoImport_${tbodyId}" class="autoImport" min="0" value="0">`;
        let buttonHtml = `<input type="button" value="一括入力" onclick="autoImport('${tbodyId}')">`;
        document.getElementById(`importButton-${tbodyId}`).innerHTML = (bool ? `${sentense}${textHtml}${buttonHtml}` : '');
    };

    //列の値を自動計算枠（下に追加されるやつ）
    addCalculatorOfColumn(tbodyId){
        const tbody_result = document.getElementById(`totalColumns-${tbodyId}`);
        let tr = document.createElement('tr');
        for(let c = 0; c < this._tableProp[tbodyId].column; c++){
            let element = document.createElement(c === 0 ? 'th' : 'td');
            element.innerHTML = `<span style="color:blue;" id="totalColumns-${tbodyId}-c${c}">${c === 0 ? 'total' : '0'}</span>`;
            let refCell = document.getElementById(`${c === 0 ? 'th' : 'td'}-${tbodyId}-r1c${c}`);
            this._caluclatorCells.push({element: element, refCell: refCell});
            tr.appendChild(element);
        };
        tbody_result.appendChild(tr);
    };

    //行の値を自動計算枠（右に追加されるやつ）
    addCalculatorOfRow(tbodyId){
        const tbody_result = document.getElementById(`totalRows-${tbodyId}`);
        for(let r = 0; r < this._tableProp[tbodyId].row; r++){
            let tr = document.createElement('tr');
            let element = document.createElement(r === 0 ? 'th' : 'td');
            element.innerHTML = `<span style="color:blue;" id="totalRows-${tbodyId}-r${r}">${r === 0 ? 'total' : '0'}</span>`;
            let refCell = document.getElementById(`${r === 0 ? 'th' : 'td'}-${tbodyId}-r${r}c1`);
            this._caluclatorCells.push({element: element, refCell: refCell});
            tr.appendChild(element);
            tbody_result.appendChild(tr);
        };
    };

    caluclatorCells(){
        return this._caluclatorCells;
    };
};

/**
 * 自動計算や自動入力処理のためのクラス
 */

class ControlMatrix {
    constructor(tbodyId, tableProp){
        this._tbodyId = tbodyId;
        this._prop = tableProp[tbodyId];
        this.initialize();
    };

    initialize(){
        this._totalRowsId    = `totalRows-${this._tbodyId}`;
        this._totalColumnsId = `totalColumns-${this._tbodyId}`;
        this._totalId        =`total-${this._tbodyId}`;
        this._exists = {
            totalRows   : document.getElementById(`${this._totalRowsId}-r1`) !== null,
            totalColumns: document.getElementById(`${this._totalColumnsId}-c1`) !== null,
            total       : document.getElementById(this._totalId) !== null
        };
    };

    autoCalculateColumn(columnNumber){
        const spanElem = document.getElementById(`${this._totalColumnsId}-c${columnNumber}`);
        spanElem.textContent = Array.from({length:this._prop.row - 1}).reduce((p, _, i) => {
            let e = document.getElementById(`${this._tbodyId}-r${i + 1}c${columnNumber}`);
            if(e === null){
                return p;
            };
            return p + Number(e.value || 0);
        }, 0);
    };

    autoCalculateRow(rowNumber){
        const spanElem = document.getElementById(`${this._totalRowsId}-r${rowNumber}`);
        spanElem.textContent = Array.from({length:this._prop.column - 1}).reduce((p, _, i) => {
            let e = document.getElementById(`${this._tbodyId}-r${rowNumber}c${i + 1}`);
            if(e === null){
                return p;
            };
            return p + Number(e.value || 0);
        }, 0);
    };

    autoCalculateAll(){
        const spanElem = document.getElementById(this._totalId);
        let total = 0;
        for(let r = 1; r < this._prop.row; r++){
            for(let c = 1; c < this._prop.column; c++){
                let e = document.getElementById(`${this._tbodyId}-r${r}c${c}`);
                if(e !== null){
                    total += Number(e.value || 0);
                };
            };
        };
        spanElem.textContent = total;
    };

    autoCalculate(rowNumber = -1, columnNumber = -1){
        if(this._exists.totalColumns && columnNumber > 0){
            this.autoCalculateColumn(columnNumber);
        };
        if(this._exists.totalRows && rowNumber > 0){
            this.autoCalculateRow(rowNumber);
        };
        if(this._exists.total){
            this.autoCalculateAll();
        };
    };

    autoImport(){
        let value = document.getElementById(`autoImport_${this._tbodyId}`).value;
        for(let r = 1; r < this._prop.row; r++){
            for(let c = 1; c < this._prop.column; c++){
                let element = document.getElementById(`${this._tbodyId}-r${r}c${c}`);
                if(element !== null){
                    element.value = Number(value || 0);
                };
            };
        };
        this.allCalculate();
    };

    allCalculate(){
        if(this._exists.totalColumns){
            for(let c = 1; c < this._prop.column; c++){
                this.autoCalculateColumn(c);
            };
        };
        if(this._exists.totalRows){
            for(let r = 1; r < this._prop.row; r++){
                this.autoCalculateRow(r);
            };
        };
        if(this._exists.total){
            this.autoCalculateAll();
        };
    };
};